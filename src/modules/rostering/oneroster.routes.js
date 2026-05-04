import express from 'express';
import multer from 'multer';
import {
  uploadOneRosterCSV,
  importFullRoster,
  handleRosterChanges,
  exportRoster,
  getRosterSyncStatus,
  oneRosterApiProxy
} from './oneroster.controller.js';
import { isAuthenticated } from '../../middlewares/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
const multiUpload = upload.fields([
  { name: 'users', maxCount: 1 },
  { name: 'classes', maxCount: 1 },
  { name: 'enrollments', maxCount: 1 },
  { name: 'courses', maxCount: 1 }
]);

// OneRoster CSV import routes
router.post('/import/:entityType', isAuthenticated, upload.single('file'), uploadOneRosterCSV);
router.post('/import-full', isAuthenticated, multiUpload, importFullRoster);
router.post('/changes', isAuthenticated, handleRosterChanges);
router.get('/export', isAuthenticated, exportRoster);
router.get('/sync-status', isAuthenticated, getRosterSyncStatus);

// OneRoster API proxy
router.get('/api/:endpoint', isAuthenticated, oneRosterApiProxy);
router.get('/api/:endpoint/:id', isAuthenticated, oneRosterApiProxy);

export default router;
