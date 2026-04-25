import express from 'express';
import {
  getDistrictOverview,
  getStudentEngagement,
  getAssessmentAnalytics,
  getCourseCompletionRates,
  getTeacherActivity,
  getComplianceReport,
  exportAnalyticsReport
} from './district-analytics.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// District admin analytics routes
router.get('/overview', isAuthenticated, getDistrictOverview);
router.get('/engagement', isAuthenticated, getStudentEngagement);
router.get('/assessments', isAuthenticated, getAssessmentAnalytics);
router.get('/completion', isAuthenticated, getCourseCompletionRates);
router.get('/teachers', isAuthenticated, getTeacherActivity);
router.get('/compliance', isAuthenticated, getComplianceReport);
router.get('/export', isAuthenticated, exportAnalyticsReport);

export default router;
