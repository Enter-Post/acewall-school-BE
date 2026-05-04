import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../../middlewares/error.js';
import {
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getMicrosoftTeams,
  getOneDriveFiles,
  getOutlookCalendar,
  createTeamsMeeting,
  disconnectMicrosoft
} from './microsoft-365.service.js';
import User from '../../Models/user.model.js';

// Initiate Microsoft OAuth
export const initiateMicrosoftAuth = catchAsyncErrors(async (req, res, next) => {
  const { redirectUrl } = req.query;
  const authUrl = getMicrosoftAuthUrl(req.user._id, redirectUrl);
  
  res.status(200).json({
    success: true,
    authUrl
  });
});

// Handle Microsoft OAuth callback
export const microsoftCallback = catchAsyncErrors(async (req, res, next) => {
  const { code, state } = req.query;
  
  if (!code) {
    return next(new ErrorHandler('Authorization code required', 400));
  }
  
  const result = await handleMicrosoftCallback(code, state);
  
  if (!result.success) {
    return next(new ErrorHandler(result.error, 400));
  }
  
  const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  if (stateData.redirectUrl) {
    return res.redirect(`${stateData.redirectUrl}?success=true`);
  }
  
  res.status(200).json({
    success: true,
    message: 'Microsoft 365 account connected successfully',
    user: result.microsoftUser
  });
});

// Get connection status
export const getMicrosoftStatus = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('microsoftTokens');
  
  res.status(200).json({
    success: true,
    connected: !!user?.microsoftTokens?.accessToken,
    expiresAt: user?.microsoftTokens?.expiresAt
  });
});

// Get Microsoft Teams
export const getTeams = catchAsyncErrors(async (req, res, next) => {
  const teams = await getMicrosoftTeams(req.user._id);
  
  res.status(200).json({
    success: true,
    count: teams.length,
    teams
  });
});

// Get OneDrive files
export const getOneDrive = catchAsyncErrors(async (req, res, next) => {
  const { folderId } = req.query;
  const files = await getOneDriveFiles(req.user._id, folderId);
  
  res.status(200).json({
    success: true,
    count: files.length,
    files
  });
});

// Get Outlook Calendar
export const getCalendar = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const events = await getOutlookCalendar(req.user._id, startDate, endDate);
  
  res.status(200).json({
    success: true,
    count: events.length,
    events
  });
});

// Create Teams meeting
export const createMeeting = catchAsyncErrors(async (req, res, next) => {
  const meeting = await createTeamsMeeting(req.user._id, req.body);
  
  res.status(201).json({
    success: true,
    meeting: {
      id: meeting.id,
      joinUrl: meeting.onlineMeeting?.joinUrl,
      subject: meeting.subject,
      start: meeting.start,
      end: meeting.end
    }
  });
});

// Disconnect Microsoft integration
export const disconnectMicrosoftIntegration = catchAsyncErrors(async (req, res, next) => {
  await disconnectMicrosoft(req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Microsoft 365 integration disconnected'
  });
});

export default {
  initiateMicrosoftAuth,
  microsoftCallback,
  getMicrosoftStatus,
  getTeams,
  getOneDrive,
  getCalendar,
  createMeeting,
  disconnectMicrosoftIntegration
};
