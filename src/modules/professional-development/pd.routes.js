import express from 'express';
import {
  getMyModules,
  getModule,
  startModule,
  updateProgress,
  submitModuleQuiz,
  getMyProgress,
  createPDModule,
  updatePDModule,
  getAllModules,
  getDistrictPDAnalytics,
  initDefaultModules
} from './pd.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// User PD routes
router.get('/my-modules', isAuthenticated, getMyModules);
router.get('/progress', isAuthenticated, getMyProgress);
router.get('/module/:moduleId', isAuthenticated, getModule);
router.post('/module/:moduleId/start', isAuthenticated, startModule);
router.post('/module/:moduleId/progress', isAuthenticated, updateProgress);
router.post('/module/:moduleId/quiz', isAuthenticated, submitModuleQuiz);

// Admin PD routes
router.get('/admin/modules', isAuthenticated, getAllModules);
router.post('/admin/modules', isAuthenticated, createPDModule);
router.put('/admin/modules/:moduleId', isAuthenticated, updatePDModule);
router.get('/admin/analytics', isAuthenticated, getDistrictPDAnalytics);
router.post('/admin/init-defaults', isAuthenticated, initDefaultModules);

export default router;
