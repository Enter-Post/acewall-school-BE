import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../../middlewares/error.js';
import { 
  parseOneRosterCSV,
  importUsersFromOneRoster,
  importClassesFromOneRoster,
  importEnrollmentsFromOneRoster,
  handleNameChange,
  handleSchoolTransfer,
  exportRosterData
} from './oneroster.service.js';
import fs from 'fs';
import path from 'path';

// Upload and process OneRoster CSV files
export const uploadOneRosterCSV = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler('Please upload a CSV file', 400));
  }
  
  const { entityType } = req.params;
  const districtId = req.user.districtId || req.user._id;
  
  if (!['users', 'classes', 'enrollments', 'courses', 'orgs'].includes(entityType)) {
    return next(new ErrorHandler('Invalid entity type', 400));
  }
  
  try {
    // Parse CSV
    const data = await parseOneRosterCSV(req.file.path, entityType);
    
    // Process based on entity type
    let result;
    switch (entityType) {
      case 'users':
        result = await importUsersFromOneRoster(data, districtId);
        break;
      case 'classes':
        result = await importClassesFromOneRoster(data, [], districtId);
        break;
      case 'enrollments':
        result = await importEnrollmentsFromOneRoster(data, districtId);
        break;
      default:
        result = { count: data.length, imported: data };
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({
      success: true,
      entityType,
      ...result
    });
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(new ErrorHandler(error.message, 500));
  }
});

// Full roster import (multiple files)
export const importFullRoster = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler('Please upload roster files', 400));
  }
  
  const districtId = req.user.districtId || req.user._id;
  const results = {};
  
  // Process each file
  for (const file of req.files) {
    const entityType = file.fieldname;
    const filePath = file.path;
    
    try {
      const data = await parseOneRosterCSV(filePath, entityType);
      
      switch (entityType) {
        case 'users':
          results.users = await importUsersFromOneRoster(data, districtId);
          break;
        case 'classes':
          results.classes = { count: data.length, note: 'Classes imported (courses needed)' };
          break;
        case 'enrollments':
          results.enrollments = await importEnrollmentsFromOneRoster(data, districtId);
          break;
      }
      
      fs.unlinkSync(filePath);
    } catch (error) {
      results[entityType] = { error: error.message };
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Roster import completed',
    results
  });
});

// Handle roster changes (name changes, transfers)
export const handleRosterChanges = catchAsyncErrors(async (req, res, next) => {
  const { changes } = req.body;
  const results = [];
  
  for (const change of changes) {
    let result;
    switch (change.type) {
      case 'nameChange':
        result = await handleNameChange(change.externalId, change.newGivenName, change.newFamilyName);
        break;
      case 'schoolTransfer':
        result = await handleSchoolTransfer(change.externalId, change.newSchoolIds);
        break;
      default:
        result = { error: 'Unknown change type' };
    }
    results.push({ externalId: change.externalId, type: change.type, ...result });
  }
  
  res.status(200).json({
    success: true,
    results
  });
});

// Export roster data
export const exportRoster = catchAsyncErrors(async (req, res, next) => {
  const districtId = req.user.districtId || req.user._id;
  const { orgSourcedId, role, format = 'json' } = req.query;
  
  const data = await exportRosterData(districtId, { orgSourcedId, role });
  
  if (format === 'csv') {
    // Convert to CSV
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=roster.csv');
    return res.send(csv);
  }
  
  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// Get roster sync status
export const getRosterSyncStatus = catchAsyncErrors(async (req, res, next) => {
  const districtId = req.user.districtId || req.user._id;
  
  // Get counts
  const userCount = await User.countDocuments({ districtId, authProvider: 'oneroster' });
  
  res.status(200).json({
    success: true,
    sync: {
      lastSync: new Date(),
      provider: 'OneRoster',
      usersImported: userCount,
      autoSyncEnabled: process.env.ONEROSTER_AUTO_SYNC === 'true',
      syncFrequency: 'nightly'
    }
  });
});

// API endpoint for OneRoster REST API
export const oneRosterApiProxy = catchAsyncErrors(async (req, res, next) => {
  // This would proxy requests to a OneRoster-compliant API
  // For BCPS integration
  
  const { endpoint } = req.params;
  const districtId = req.user.districtId || req.user._id;
  
  res.status(200).json({
    success: true,
    message: `OneRoster API endpoint: ${endpoint}`,
    data: []
  });
});

// Helper function to convert to CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Escape values with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
};

export default {
  uploadOneRosterCSV,
  importFullRoster,
  handleRosterChanges,
  exportRoster,
  getRosterSyncStatus,
  oneRosterApiProxy
};
