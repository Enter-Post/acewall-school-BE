import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../../middlewares/error.js';
import {
  getModulesForUser,
  getModuleDetails,
  updateModuleProgress,
  submitQuiz,
  createModule,
  updateModule,
  getPDAnalytics,
  createDefaultModules,
  PDModule
} from './pd.service.js';

// Get all PD modules for current user
export const getMyModules = catchAsyncErrors(async (req, res, next) => {
  const modules = await getModulesForUser(req.user._id, req.user.role);
  
  res.status(200).json({
    success: true,
    modules
  });
});

// Get specific module details
export const getModule = catchAsyncErrors(async (req, res, next) => {
  const { moduleId } = req.params;
  const module = await getModuleDetails(moduleId, req.user._id);
  
  if (!module) {
    return next(new ErrorHandler('Module not found', 404));
  }
  
  res.status(200).json({
    success: true,
    module
  });
});

// Start a module
export const startModule = catchAsyncErrors(async (req, res, next) => {
  const { moduleId } = req.params;
  const progress = await updateModuleProgress(req.user._id, moduleId, {
    contentId: 'start',
    completed: true,
    timeSpent: 0
  });
  
  res.status(200).json({
    success: true,
    message: 'Module started',
    progress
  });
});

// Update progress on content
export const updateProgress = catchAsyncErrors(async (req, res, next) => {
  const { moduleId } = req.params;
  const { contentId, completed, timeSpent } = req.body;
  
  const progress = await updateModuleProgress(req.user._id, moduleId, {
    contentId,
    completed,
    timeSpent
  });
  
  res.status(200).json({
    success: true,
    progress
  });
});

// Submit quiz
export const submitModuleQuiz = catchAsyncErrors(async (req, res, next) => {
  const { moduleId } = req.params;
  const { quizId, score } = req.body;
  
  const result = await submitQuiz(req.user._id, moduleId, quizId, score);
  
  res.status(200).json({
    success: true,
    result
  });
});

// Get user's PD progress overview
export const getMyProgress = catchAsyncErrors(async (req, res, next) => {
  const modules = await getModulesForUser(req.user._id, req.user.role);
  
  const stats = {
    totalModules: modules.length,
    completed: modules.filter(m => m.userProgress?.status === 'completed').length,
    inProgress: modules.filter(m => m.userProgress?.status === 'in_progress').length,
    notStarted: modules.filter(m => !m.userProgress || m.userProgress.status === 'not_started').length,
    certificatesEarned: modules.filter(m => m.userProgress?.certificateIssued).length,
    totalTimeSpent: modules.reduce((acc, m) => acc + (m.userProgress?.timeSpent || 0), 0)
  };
  
  res.status(200).json({
    success: true,
    stats,
    modules
  });
});

// Admin: Create new PD module
export const createPDModule = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'district_admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const module = await createModule(req.body);
  
  res.status(201).json({
    success: true,
    module
  });
});

// Admin: Update PD module
export const updatePDModule = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'district_admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const { moduleId } = req.params;
  const module = await updateModule(moduleId, req.body);
  
  if (!module) {
    return next(new ErrorHandler('Module not found', 404));
  }
  
  res.status(200).json({
    success: true,
    module
  });
});

// Admin: Get all modules
export const getAllModules = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'district_admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const { category, isActive } = req.query;
  const query = {};
  
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const modules = await PDModule.find(query).sort({ category: 1, title: 1 });
  
  res.status(200).json({
    success: true,
    count: modules.length,
    modules
  });
});

// Admin: Get district PD analytics
export const getDistrictPDAnalytics = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'district_admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const districtId = req.user.districtId || req.user._id;
  const analytics = await getPDAnalytics(districtId);
  
  res.status(200).json({
    success: true,
    analytics
  });
});

// Admin: Initialize default PD modules
export const initDefaultModules = catchAsyncErrors(async (req, res, next) => {
  if (!['admin', 'district_admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  await createDefaultModules();
  
  res.status(200).json({
    success: true,
    message: 'Default PD modules created'
  });
});

export default {
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
};
