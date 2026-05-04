import express from 'express';
import {
  initiateGoogleAuth,
  googleCallback,
  getGoogleStatus,
  getGoogleClassroomCourses,
  syncGoogleClassroom,
  importGoogleDrive,
  getGoogleCalendar,
  createGoogleAssignment,
  disconnectGoogleIntegration
} from './google-workspace.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// Google OAuth
router.get('/auth', isAuthenticated, initiateGoogleAuth);
router.get('/callback', googleCallback);
router.get('/status', isAuthenticated, getGoogleStatus);

// Google Classroom
router.get('/classroom/courses', isAuthenticated, getGoogleClassroomCourses);
router.post('/classroom/courses/:courseId/sync', isAuthenticated, syncGoogleClassroom);
router.post('/classroom/courses/:courseId/assignments', isAuthenticated, createGoogleAssignment);

// Google Drive
router.get('/drive/files', isAuthenticated, importGoogleDrive);

// Google Calendar
router.get('/calendar/events', isAuthenticated, getGoogleCalendar);

// Disconnect
router.post('/disconnect', isAuthenticated, disconnectGoogleIntegration);

export default router;
