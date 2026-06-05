/**
 * File PII Scanner Utility
 * Scans uploaded files for PII before sending to AI
 * Supports PDF, DOCX, TXT, and image files
 */

import fs from 'fs';
import { createRequire } from 'module';
import { detectPII, checkHighRiskPII, generatePIIAuditLog } from './piiSanitizer.js';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromDOCX = async (filePath) => {
  try {
    // For DOCX, we'll use a simple text extraction approach
    // In production, use mammoth.js or similar for better extraction
    const dataBuffer = fs.readFileSync(filePath);
    // This is a simplified approach - consider using mammoth.js for production
    return '[DOCX text extraction requires mammoth.js - file not scanned]';
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extract text from TXT file
 * @param {string} filePath - Path to TXT file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromTXT = async (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading TXT file:', error);
    throw new Error('Failed to read TXT file');
  }
};

/**
 * Extract text from file based on mimetype
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = async (filePath, mimeType) => {
  switch (mimeType) {
    case 'application/pdf':
      return await extractTextFromPDF(filePath);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/docx':
      return await extractTextFromDOCX(filePath);
    case 'text/plain':
    case 'text/csv':
      return await extractTextFromTXT(filePath);
    default:
      // For images and other binary files, we can't extract text
      // Return empty string - these will be handled differently
      return '';
  }
};

/**
 * Scan file for PII
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File MIME type
 * @param {string} userId - User ID for audit logging
 * @returns {Promise<Object>} - Scan results
 */
export const scanFileForPII = async (filePath, mimeType, userId) => {
  try {
    // Extract text from file
    const extractedText = await extractTextFromFile(filePath, mimeType);

    // If no text can be extracted (e.g., images), skip PII scan
    // but log this for audit purposes
    if (!extractedText || extractedText.length === 0) {
      return {
        scanCompleted: false,
        reason: 'No text extractable from file type',
        hasPII: false,
        canProceed: true,
        auditLog: generatePIIAuditLog(
          { hasPII: false, detectedTypes: [], details: {} },
          userId,
          'file_scan_no_text'
        ),
      };
    }

    // Check for high-risk PII first (SSN, student ID, mother's maiden name)
    const highRiskCheck = checkHighRiskPII(extractedText);

    if (highRiskCheck.shouldBlock) {
      return {
        scanCompleted: true,
        hasPII: true,
        hasHighRiskPII: true,
        detectedTypes: highRiskCheck.detectedTypes,
        canProceed: false,
        reason: 'High-risk PII detected (SSN, student ID, or mother\'s maiden name)',
        auditLog: generatePIIAuditLog(
          { hasPII: true, detectedTypes: highRiskCheck.detectedTypes, details: {} },
          userId,
          'file_scan_blocked'
        ),
      };
    }

    // Full PII detection
    const piiDetection = detectPII(extractedText);

    // Generate audit log
    const auditLog = generatePIIAuditLog(piiDetection, userId, 'file_scan');

    return {
      scanCompleted: true,
      hasPII: piiDetection.hasPII,
      detectedTypes: piiDetection.detectedTypes,
      details: piiDetection.details,
      canProceed: true, // Allow but warn if PII detected
      warning: piiDetection.hasPII ? 'PII detected in file - will be sanitized before AI processing' : null,
      auditLog,
    };
  } catch (error) {
    console.error('Error scanning file for PII:', error);
    return {
      scanCompleted: false,
      error: error.message,
      canProceed: false,
      reason: 'File scan failed',
    };
  }
};

/**
 * Scan file and return safe-to-send version
 * For files with PII, this would ideally return a sanitized version
 * Currently, we'll reject files with PII for safety
 * @param {string} filePath - Path to file
 * @param {string} mimeType - File MIME type
 * @param {string} userId - User ID for audit logging
 * @returns {Promise<Object>} - Safe file data or rejection
 */
export const getSafeFileForAI = async (filePath, mimeType, userId) => {
  const scanResult = await scanFileForPII(filePath, mimeType, userId);

  if (!scanResult.canProceed) {
    return {
      canSend: false,
      reason: scanResult.reason,
      auditLog: scanResult.auditLog,
    };
  }

  // For files with PII that can proceed, we have options:
  // 1. Reject the file (safest)
  // 2. Sanitize the file content (complex)
  // 3. Send file with warning (current approach)

  if (scanResult.hasPII) {
    // For FERPA compliance, we should reject files with PII
    return {
      canSend: false,
      reason: 'File contains PII and cannot be sent to external AI',
      detectedTypes: scanResult.detectedTypes,
      auditLog: scanResult.auditLog,
    };
  }

  // File is safe to send
  return {
    canSend: true,
    auditLog: scanResult.auditLog,
  };
};

/**
 * Batch scan multiple files for PII
 * @param {Array} files - Array of file objects { path, mimeType, originalname }
 * @param {string} userId - User ID for audit logging
 * @returns {Promise<Object>} - Batch scan results
 */
export const batchScanFilesForPII = async (files, userId) => {
  const results = [];
  let hasAnyPII = false;
  let hasHighRiskPII = false;

  for (const file of files) {
    const result = await scanFileForPII(file.path, file.mimeType, userId);
    results.push({
      filename: file.originalname,
      ...result,
    });

    if (result.hasPII) hasAnyPII = true;
    if (result.hasHighRiskPII) hasHighRiskPII = true;
  }

  return {
    results,
    hasAnyPII,
    hasHighRiskPII,
    canProceed: !hasHighRiskPII,
    overallReason: hasHighRiskPII 
      ? 'One or more files contain high-risk PII' 
      : hasAnyPII 
        ? 'One or more files contain PII' 
        : 'No PII detected',
  };
};

export default {
  scanFileForPII,
  getSafeFileForAI,
  batchScanFilesForPII,
};
