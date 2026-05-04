import axios from 'axios';
import User from '../../Models/user.model.js';

// Microsoft 365 / Azure AD configuration
const MS_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MS_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const MS_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || '/api/integrations/microsoft/callback';

const AUTH_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`;
const TOKEN_URL = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

// Microsoft OAuth scopes
const SCOPES = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Files.Read',
  'https://graph.microsoft.com/Calendars.Read',
  'https://graph.microsoft.com/Team.ReadBasic.All',
  'https://graph.microsoft.com/TeamsActivity.Read',
  'offline_access'
];

// Generate Microsoft OAuth URL
export const getMicrosoftAuthUrl = (userId, redirectUrl) => {
  const state = Buffer.from(JSON.stringify({ userId, redirectUrl })).toString('base64');
  
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    scope: SCOPES.join(' '),
    state: state,
    response_mode: 'query'
  });
  
  return `${AUTH_URL}?${params.toString()}`;
};

// Handle Microsoft OAuth callback
export const handleMicrosoftCallback = async (code, state) => {
  try {
    const tokenResponse = await axios.post(TOKEN_URL, {
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      code: code,
      redirect_uri: MS_REDIRECT_URI,
      grant_type: 'authorization_code',
      scope: SCOPES.join(' ')
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user info from Microsoft Graph
    const userResponse = await axios.get(`${GRAPH_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    const msUser = userResponse.data;
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    // Store tokens
    await User.findByIdAndUpdate(stateData.userId, {
      microsoftTokens: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000)
      }
    });
    
    return { 
      success: true, 
      userId: stateData.userId,
      microsoftUser: {
        email: msUser.mail || msUser.userPrincipalName,
        displayName: msUser.displayName
      }
    };
  } catch (error) {
    console.error('Microsoft OAuth error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Get Microsoft Teams for user
export const getMicrosoftTeams = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user?.microsoftTokens?.accessToken) {
      throw new Error('Microsoft account not connected');
    }
    
    const response = await axios.get(`${GRAPH_API_URL}/me/joinedTeams`, {
      headers: {
        Authorization: `Bearer ${user.microsoftTokens.accessToken}`
      }
    });
    
    return response.data.value || [];
  } catch (error) {
    console.error('Error fetching Microsoft Teams:', error);
    return [];
  }
};

// Get OneDrive files
export const getOneDriveFiles = async (userId, folderId = null) => {
  try {
    const user = await User.findById(userId);
    const endpoint = folderId 
      ? `${GRAPH_API_URL}/me/drive/items/${folderId}/children`
      : `${GRAPH_API_URL}/me/drive/root/children`;
    
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${user.microsoftTokens.accessToken}`
      }
    });
    
    return response.data.value || [];
  } catch (error) {
    console.error('Error fetching OneDrive files:', error);
    return [];
  }
};

// Get Outlook Calendar events
export const getOutlookCalendar = async (userId, startDate, endDate) => {
  try {
    const user = await User.findById(userId);
    
    const params = new URLSearchParams({
      startDateTime: startDate || new Date().toISOString(),
      endDateTime: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      $top: '100'
    });
    
    const response = await axios.get(
      `${GRAPH_API_URL}/me/calendarview?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${user.microsoftTokens.accessToken}`
        }
      }
    );
    
    return response.data.value || [];
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return [];
  }
};

// Create Teams meeting
export const createTeamsMeeting = async (userId, meetingData) => {
  try {
    const user = await User.findById(userId);
    
    const event = {
      subject: meetingData.title,
      body: {
        contentType: 'HTML',
        content: meetingData.description || ''
      },
      start: {
        dateTime: meetingData.startTime,
        timeZone: meetingData.timeZone || 'Eastern Standard Time'
      },
      end: {
        dateTime: meetingData.endTime,
        timeZone: meetingData.timeZone || 'Eastern Standard Time'
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    };
    
    if (meetingData.attendees) {
      event.attendees = meetingData.attendees.map(email => ({
        emailAddress: { address: email },
        type: 'required'
      }));
    }
    
    const response = await axios.post(
      `${GRAPH_API_URL}/me/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${user.microsoftTokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating Teams meeting:', error);
    throw error;
  }
};

// Refresh Microsoft tokens
export const refreshMicrosoftTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user?.microsoftTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(TOKEN_URL, {
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      refresh_token: user.microsoftTokens.refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES.join(' ')
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    await User.findByIdAndUpdate(userId, {
      'microsoftTokens.accessToken': access_token,
      'microsoftTokens.refreshToken': refresh_token || user.microsoftTokens.refreshToken,
      'microsoftTokens.expiresAt': new Date(Date.now() + expires_in * 1000)
    });
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing Microsoft tokens:', error);
    throw error;
  }
};

// Disconnect Microsoft integration
export const disconnectMicrosoft = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { microsoftTokens: 1 }
  });
};

export default {
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getMicrosoftTeams,
  getOneDriveFiles,
  getOutlookCalendar,
  createTeamsMeeting,
  refreshMicrosoftTokens,
  disconnectMicrosoft
};
