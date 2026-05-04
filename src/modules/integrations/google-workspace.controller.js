import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../../middlewares/error.js';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getClassroomCourses,
  syncClassroomRoster,
  importDriveFiles,
  getCalendarEvents,
  createClassroomAssignment,
  disconnectGoogle
} from './google-workspace.service.js';
import User from '../../Models/user.model.js';

// Initiate Google OAuth
export const initiateGoogleAuth = catchAsyncErrors(async (req, res, next) => {
  const { redirectUrl } = req.query;
  const authUrl = getGoogleAuthUrl(req.user._id, redirectUrl);
  
  res.status(200).json({
    success: true,
    authUrl
  });
});

// Handle Google OAuth callback
export const googleCallback = catchAsyncErrors(async (req, res, next) => {
  const { code, state } = req.query;
  
  if (!code) {
    return next(new ErrorHandler('Authorization code required', 400));
  }
  
  const result = await handleGoogleCallback(code, state);
  
  if (!result.success) {
    return next(new ErrorHandler(result.error, 400));
  }
  
  // Redirect back to the original URL if provided
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  if (stateData.redirectUrl) {
    return res.redirect(`${stateData.redirectUrl}?success=true`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Google account connected successfully'
  });
});

// Get connection status
export const getGoogleStatus = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('googleTokens');
  
  res.status(200).json({
    success: true,
    connected: !!user?.googleTokens?.accessToken,
    hasRefreshToken: !!user?.googleTokens?.refreshToken
  });
});

// Get Google Classroom courses
export const getGoogleClassroomCourses = catchAsyncErrors(async (req, res, next) => {
  const courses = await getClassroomCourses(req.user._id);
  
  res.status(200).json({
    success: true,
    count: courses.length,
    courses
  });
});

// Sync Google Classroom roster
export const syncGoogleClassroom = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const roster = await syncClassroomRoster(req.user._id, courseId);
  
  res.status(200).json({
    success: true,
    roster
  });
});

// Import files from Google Drive
export const importGoogleDrive = catchAsyncErrors(async (req, res, next) => {
  const { folderId } = req.query;
  const files = await importDriveFiles(req.user._id, folderId);
  
  res.status(200).json({
    success: true,
    count: files.length,
    files
  });
});

// Get Google Calendar events
export const getGoogleCalendar = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const events = await getCalendarEvents(req.user._id, startDate, endDate);
  
  res.status(200).json({
    success: true,
    count: events.length,
    events
  });
});

// Create assignment in Google Classroom
export const createGoogleAssignment = catchAsyncErrors(async (req, res, next) => {
  const { courseId } = req.params;
  const assignment = await createClassroomAssignment(req.user._id, courseId, req.body);
  
  res.status(201).json({
    success: true,
    assignment
  });
});

// Disconnect Google integration
export const disconnectGoogleIntegration = catchAsyncErrors(async (req, res, next) => {
  await disconnectGoogle(req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Google integration disconnected'
  });
});

export default {
  initiateGoogleAuth,
  googleCallback,
  getGoogleStatus,
  getGoogleClassroomCourses,
  syncGoogleClassroom,
  importGoogleDrive,
  getGoogleCalendar,
  createGoogleAssignment,
  disconnectGoogleIntegration
};
