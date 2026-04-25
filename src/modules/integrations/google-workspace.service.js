import { google } from 'googleapis';
import User from '../../Models/user.model.js';

// Google Workspace configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '/api/integrations/google/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Scopes for Google Workspace integration
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Generate Google OAuth URL
export const getGoogleAuthUrl = (userId, redirectUrl) => {
  const state = Buffer.from(JSON.stringify({ userId, redirectUrl })).toString('base64');
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent'
  });
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (code, state) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;
    
    // Store tokens in user record
    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      }
    });
    
    return { success: true, userId };
  } catch (error) {
    console.error('Google OAuth error:', error);
    return { success: false, error: error.message };
  }
};

// Get Google Classroom courses
export const getClassroomCourses = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user?.googleTokens?.accessToken) {
      throw new Error('Google account not connected');
    }
    
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    const response = await classroom.courses.list({
      teacherId: user.email,
      courseStates: ['ACTIVE']
    });
    
    return response.data.courses || [];
  } catch (error) {
    console.error('Error fetching Google Classroom courses:', error);
    return [];
  }
};

// Sync Google Classroom roster to LMS
export const syncClassroomRoster = async (userId, courseId) => {
  try {
    const user = await User.findById(userId);
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    
    // Get students in course
    const studentsResponse = await classroom.courses.students.list({ courseId });
    const students = studentsResponse.data.students || [];
    
    // Get teachers in course
    const teachersResponse = await classroom.courses.teachers.list({ courseId });
    const teachers = teachersResponse.data.teachers || [];
    
    return {
      students: students.map(s => ({
        email: s.profile.emailAddress,
        name: s.profile.name.fullName,
        googleId: s.userId
      })),
      teachers: teachers.map(t => ({
        email: t.profile.emailAddress,
        name: t.profile.name.fullName,
        googleId: t.userId
      }))
    };
  } catch (error) {
    console.error('Error syncing classroom roster:', error);
    throw error;
  }
};

// Import Google Drive files
export const importDriveFiles = async (userId, folderId = null) => {
  try {
    const user = await User.findById(userId);
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const query = folderId 
      ? `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`
      : `mimeType != 'application/vnd.google-apps.folder'`;
    
    const response = await drive.files.list({
      q: query,
      pageSize: 100,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)'
    });
    
    return response.data.files || [];
  } catch (error) {
    console.error('Error importing Drive files:', error);
    throw error;
  }
};

// Get Google Calendar events
export const getCalendarEvents = async (userId, timeMin, timeMax) => {
  try {
    const user = await User.findById(userId);
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

// Push assignment to Google Classroom
export const createClassroomAssignment = async (userId, courseId, assignmentData) => {
  try {
    const user = await User.findById(userId);
    oauth2Client.setCredentials({
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken
    });
    
    const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
    
    const coursework = {
      title: assignmentData.title,
      description: assignmentData.description,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      dueDate: assignmentData.dueDate,
      dueTime: assignmentData.dueTime,
      maxPoints: assignmentData.maxPoints || 100
    };
    
    const response = await classroom.courses.courseWork.create({
      courseId,
      requestBody: coursework
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating classroom assignment:', error);
    throw error;
  }
};

// Refresh Google tokens
export const refreshGoogleTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user?.googleTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    oauth2Client.setCredentials({
      refresh_token: user.googleTokens.refreshToken
    });
    
    const { tokens } = await oauth2Client.refreshAccessToken();
    
    await User.findByIdAndUpdate(userId, {
      'googleTokens.accessToken': tokens.access_token,
      'googleTokens.expiryDate': tokens.expiry_date
    });
    
    return tokens;
  } catch (error) {
    console.error('Error refreshing Google tokens:', error);
    throw error;
  }
};

// Disconnect Google integration
export const disconnectGoogle = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { googleTokens: 1 }
  });
};

export default {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getClassroomCourses,
  syncClassroomRoster,
  importDriveFiles,
  getCalendarEvents,
  createClassroomAssignment,
  refreshGoogleTokens,
  disconnectGoogle
};
