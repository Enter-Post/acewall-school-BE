import express from 'express';
import {
  initiateMicrosoftAuth,
  microsoftCallback,
  getMicrosoftStatus,
  getTeams,
  getOneDrive,
  getCalendar,
  createMeeting,
  disconnectMicrosoftIntegration
} from './microsoft-365.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// Microsoft OAuth
router.get('/auth', isAuthenticated, initiateMicrosoftAuth);
router.get('/callback', microsoftCallback);
router.get('/status', isAuthenticated, getMicrosoftStatus);

// Microsoft Teams
router.get('/teams', isAuthenticated, getTeams);
router.post('/meetings', isAuthenticated, createMeeting);

// OneDrive
router.get('/onedrive/files', isAuthenticated, getOneDrive);

// Outlook Calendar
router.get('/calendar/events', isAuthenticated, getCalendar);

// Disconnect
router.post('/disconnect', isAuthenticated, disconnectMicrosoftIntegration);

export default router;
