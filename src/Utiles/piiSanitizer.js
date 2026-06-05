/**
 * PII Sanitization Utility
 * Detects and removes Personally Identifiable Information (PII) from text
 * Compliant with FERPA requirements for student data protection
 */

/**
 * PII Patterns for detection
 * Covers common PII types that must be protected under FERPA
 */
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (US format)
  phone: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // Social Security Numbers (SSN)
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
  
  // Student IDs (common formats)
  studentId: /\b(?:student\s*id|id\s*number|student\s*number)[:\s]*([A-Z0-9-]{4,20})\b|\bSTU-\d{5}\b/gi,
  
  // Dates of birth
  dob: /\b(?:dob|date\s*of\s*birth|birth\s*date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/gi,
  
  // Addresses (basic pattern)
  address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Place|Pl)\b/gi,
  
  // Names (first + last pattern - conservative detection)
  name: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g,
  
  // Mother's maiden name
  mothersMaidenName: /\b(?:mother'?s?\s*maiden\s*name|maiden\s*name)[:\s]*([A-Z][a-z]+)\b/gi,
};

/**
 * Redaction placeholders
 * Used to replace detected PII with generic indicators
 */
const REDACTION_PLACEHOLDERS = {
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  ssn: '[SSN_REDACTED]',
  studentId: '[STUDENT_ID_REDACTED]',
  dob: '[DOB_REDACTED]',
  address: '[ADDRESS_REDACTED]',
  name: '[NAME_REDACTED]',
  mothersMaidenName: '[MAIDEN_NAME_REDACTED]',
};

/**
 * Detect PII in text
 * @param {string} text - Text to scan for PII
 * @returns {Object} - Detection results with found PII types and locations
 */
export const detectPII = (text) => {
  if (!text || typeof text !== 'string') {
    return { hasPII: false, detectedTypes: [], details: {} };
  }

  const detectedTypes = [];
  const details = {};

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      detectedTypes.push(type);
      details[type] = {
        count: matches.length,
        samples: matches.slice(0, 3), // Store up to 3 samples for audit
      };
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    details,
  };
};

/**
 * Sanitize text by removing/redacting PII
 * @param {string} text - Text to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.redact - Whether to redact (true) or remove (false) PII
 * @param {string[]} options.excludeTypes - PII types to exclude from sanitization
 * @returns {Object} - Sanitized text and sanitization report
 */
export const sanitizeText = (text, options = {}) => {
  const { redact = true, excludeTypes = [] } = options;
  
if (!text || typeof text !== 'string') {
  return { 
    sanitizedText: text || '', 
    report: { originalLength: 0, sanitizedLength: 0, changes: [], hasPII: false } 
  };
}

  let sanitizedText = text;
  const changes = [];
  const originalLength = text.length;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (excludeTypes.includes(type)) continue;

    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const placeholder = REDACTION_PLACEHOLDERS[type];
      
      if (redact) {
        // Replace with placeholder
        sanitizedText = sanitizedText.replace(pattern, placeholder);
      } else {
        // Remove entirely
        sanitizedText = sanitizedText.replace(pattern, '');
      }

      changes.push({
        type,
        count: matches.length,
        action: redact ? 'redacted' : 'removed',
      });
    }
  }

  // Clean up extra whitespace from removals
  if (!redact) {
    sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();
  }

  return {
    sanitizedText,
    report: {
      originalLength,
      sanitizedLength: sanitizedText.length,
      changes,
      hasPII: changes.length > 0,
    },
  };
};

/**
 * Sanitize conversation context (chat history)
 * @param {Object} context - Conversation context object
 * @returns {Object} - Sanitized context
 */
export const sanitizeConversationContext = (context) => {
  if (!context) return context;

  const sanitized = { ...context };

  // Sanitize question text
  if (context.question && typeof context.question === 'object') {
    if (context.question.text) {
      const { sanitizedText, report } = sanitizeText(context.question.text);
      sanitized.question = {
        ...context.question,
        text: sanitizedText,
        _sanitized: report.hasPII,
      };
    }
  } else if (typeof context.question === 'string') {
    const { sanitizedText, report } = sanitizeText(context.question);
    sanitized.question = sanitizedText;
    sanitized._questionSanitized = report.hasPII;
  }

  // Sanitize answer text
  if (context.answer && typeof context.answer === 'object') {
    if (context.answer.text) {
      const { sanitizedText, report } = sanitizeText(context.answer.text);
      sanitized.answer = {
        ...context.answer,
        text: sanitizedText,
        _sanitized: report.hasPII,
      };
    }
  } else if (typeof context.answer === 'string') {
    const { sanitizedText, report } = sanitizeText(context.answer);
    sanitized.answer = sanitizedText;
    sanitized._answerSanitized = report.hasPII;
  }

  return sanitized;
};

/**
 * Check if text contains high-risk PII (SSN, student ID, mother's maiden name)
 * These require immediate blocking
 * @param {string} text - Text to check
 * @returns {Object} - High-risk PII check result
 */
export const checkHighRiskPII = (text) => {
  if (!text || typeof text !== 'string') {
    return { hasHighRiskPII: false, detectedTypes: [], shouldBlock: false };
  }

  const highRiskTypes = ['ssn', 'studentId', 'mothersMaidenName'];
  const detectedTypes = [];

  for (const type of highRiskTypes) {
    const pattern = PII_PATTERNS[type];
    if (pattern) {
      // CRITICAL: Reset the regex position pointer to avoid global flag matching issues
      pattern.lastIndex = 0; 
      if (pattern.test(text)) {
        detectedTypes.push(type);
      }
    }
  }

  return {
    hasHighRiskPII: detectedTypes.length > 0,
    detectedTypes,
    shouldBlock: detectedTypes.length > 0,
  };
};

/**
 * Sanitize prompt for AI
 * Ensures no PII is sent to external AI services
 * @param {string} prompt - AI prompt to sanitize
 * @returns {Object} - Sanitized prompt and report
 */
export const sanitizeAIPrompt = (prompt) => {
  const highRiskCheck = checkHighRiskPII(prompt);
  
  if (highRiskCheck.shouldBlock) {
    return {
      sanitizedPrompt: null,
      blocked: true,
      reason: 'High-risk PII detected',
      detectedTypes: highRiskCheck.detectedTypes,
    };
  }

  const { sanitizedText, report } = sanitizeText(prompt, { redact: true });

  return {
    sanitizedPrompt: sanitizedText,
    blocked: false,
    report,
  };
};

/**
 * Generate audit log entry for PII detection
 * @param {Object} detectionResult - Result from detectPII()
 * @param {string} userId - User ID
 * @param {string} context - Context of detection (e.g., 'question', 'file')
 * @returns {Object} - Audit log entry
 */
export const generatePIIAuditLog = (detectionResult, userId, context) => {
  return {
    timestamp: new Date().toISOString(),
    userId,
    eventType: 'pii_detection',
    context,
    hasPII: detectionResult.hasPII,
    detectedTypes: detectionResult.detectedTypes,
    details: detectionResult.details,
    actionTaken: detectionResult.hasPII ? 'sanitized' : 'none',
  };
};

export default {
  detectPII,
  sanitizeText,
  sanitizeConversationContext,
  checkHighRiskPII,
  sanitizeAIPrompt,
  generatePIIAuditLog,
};

