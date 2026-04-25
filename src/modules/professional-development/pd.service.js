import mongoose from 'mongoose';

// PD Module Schema
const PDModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['onboarding', 'platform', 'pedagogy', 'assessment', 'data_analysis', 'compliance'],
    required: true
  },
  targetAudience: [{
    type: String,
    enum: ['teacher', 'admin', 'district_admin', 'parent']
  }],
  content: [{
    type: { type: String, enum: ['video', 'document', 'quiz', 'interactive'] },
    title: { type: String },
    url: { type: String },
    duration: { type: Number }, // in minutes
    order: { type: Number }
  }],
  learningObjectives: [{ type: String }],
  estimatedDuration: { type: Number }, // total minutes
  completionCriteria: {
    type: { type: String, enum: ['view_all', 'quiz_pass', 'time_spent'] },
    threshold: { type: Number }
  },
  certificateEnabled: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Progress Schema
const UserPDProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'PDModule', required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  progress: { type: Number, default: 0 }, // percentage
  startedAt: { type: Date },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }, // minutes
  contentProgress: [{
    contentId: { type: String },
    completed: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }
  }],
  quizScores: [{
    quizId: { type: String },
    score: { type: Number },
    passed: { type: Boolean },
    attempts: { type: Number, default: 0 }
  }],
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: { type: String }
});

export const PDModule = mongoose.model('PDModule', PDModuleSchema);
export const UserPDProgress = mongoose.model('UserPDProgress', UserPDProgressSchema);

// Get all PD modules for user
export const getModulesForUser = async (userId, role) => {
  const modules = await PDModule.find({
    targetAudience: role,
    isActive: true
  }).sort({ category: 1, title: 1 });
  
  // Get progress for each module
  const progress = await UserPDProgress.find({ user: userId });
  const progressMap = new Map(progress.map(p => [p.module.toString(), p]));
  
  return modules.map(module => ({
    ...module.toObject(),
    userProgress: progressMap.get(module._id.toString()) || null
  }));
};

// Get module details with content
export const getModuleDetails = async (moduleId, userId) => {
  const module = await PDModule.findById(moduleId);
  if (!module) return null;
  
  const progress = await UserPDProgress.findOne({
    user: userId,
    module: moduleId
  });
  
  return {
    ...module.toObject(),
    userProgress: progress
  };
};

// Start or update module progress
export const updateModuleProgress = async (userId, moduleId, contentProgress) => {
  let progress = await UserPDProgress.findOne({
    user: userId,
    module: moduleId
  });
  
  if (!progress) {
    progress = await UserPDProgress.create({
      user: userId,
      module: moduleId,
      status: 'in_progress',
      startedAt: new Date(),
      contentProgress: []
    });
  }
  
  // Update content progress
  const existing = progress.contentProgress.find(
    cp => cp.contentId === contentProgress.contentId
  );
  
  if (existing) {
    existing.completed = contentProgress.completed;
    existing.timeSpent += contentProgress.timeSpent || 0;
  } else {
    progress.contentProgress.push(contentProgress);
  }
  
  // Calculate overall progress
  const module = await PDModule.findById(moduleId);
  const completedCount = progress.contentProgress.filter(cp => cp.completed).length;
  progress.progress = Math.round((completedCount / module.content.length) * 100);
  
  // Check completion
  if (progress.progress >= 100) {
    progress.status = 'completed';
    progress.completedAt = new Date();
    
    if (module.certificateEnabled && !progress.certificateIssued) {
      progress.certificateIssued = true;
      progress.certificateUrl = generateCertificateUrl(userId, moduleId);
    }
  }
  
  await progress.save();
  return progress;
};

// Submit quiz for PD module
export const submitQuiz = async (userId, moduleId, quizId, score) => {
  const progress = await UserPDProgress.findOne({
    user: userId,
    module: moduleId
  });
  
  if (!progress) {
    throw new Error('Module not started');
  }
  
  const module = await PDModule.findById(moduleId);
  const quizScore = {
    quizId,
    score,
    passed: score >= (module.completionCriteria.threshold || 70),
    attempts: 1
  };
  
  const existing = progress.quizScores.find(q => q.quizId === quizId);
  if (existing) {
    existing.score = score;
    existing.passed = quizScore.passed;
    existing.attempts += 1;
  } else {
    progress.quizScores.push(quizScore);
  }
  
  await progress.save();
  return { quizScore, progress };
};

// Create PD module (admin only)
export const createModule = async (moduleData) => {
  return await PDModule.create(moduleData);
};

// Update PD module
export const updateModule = async (moduleId, updateData) => {
  return await PDModule.findByIdAndUpdate(
    moduleId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
};

// Get PD analytics for district
export const getPDAnalytics = async (districtId) => {
  const usersInDistrict = await mongoose.model('User').find({
    districtId: districtId.toString()
  }).select('_id role');
  
  const userIds = usersInDistrict.map(u => u._id);
  
  const progressStats = await UserPDProgress.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $lookup: {
        from: 'pdmodules',
        localField: 'module',
        foreignField: '_id',
        as: 'module'
      }
    },
    { $unwind: '$module' },
    {
      $group: {
        _id: '$module.category',
        totalEnrolled: { $sum: 1 },
        completed: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgProgress: { $avg: '$progress' }
      }
    }
  ]);
  
  return progressStats;
};

// Generate certificate URL helper
const generateCertificateUrl = (userId, moduleId) => {
  return `/certificates/pd/${userId}/${moduleId}.pdf`;
};

// Create default PD modules for BCPS
export const createDefaultModules = async () => {
  const defaultModules = [
    {
      title: 'Acewall LMS Platform Onboarding',
      description: 'Essential training for new users on the Acewall Scholars LMS platform',
      category: 'onboarding',
      targetAudience: ['teacher', 'admin', 'district_admin'],
      content: [
        { type: 'video', title: 'Platform Overview', duration: 15, order: 1 },
        { type: 'document', title: 'Navigation Guide', duration: 10, order: 2 },
        { type: 'interactive', title: 'Practice Activities', duration: 20, order: 3 },
        { type: 'quiz', title: 'Knowledge Check', duration: 10, order: 4 }
      ],
      learningObjectives: [
        'Navigate the LMS interface confidently',
        'Access and manage courses',
        'Use assessment tools effectively'
      ],
      estimatedDuration: 55,
      completionCriteria: { type: 'quiz_pass', threshold: 80 }
    },
    {
      title: 'Digital Pedagogy Best Practices',
      description: 'Teaching strategies for effective online and blended learning',
      category: 'pedagogy',
      targetAudience: ['teacher', 'instructor'],
      content: [
        { type: 'video', title: 'Engaging Digital Learners', duration: 25, order: 1 },
        { type: 'document', title: 'Lesson Planning Template', duration: 15, order: 2 },
        { type: 'interactive', title: 'Case Studies', duration: 30, order: 3 }
      ],
      learningObjectives: [
        'Design engaging online lessons',
        'Facilitate virtual discussions',
        'Provide effective digital feedback'
      ],
      estimatedDuration: 70,
      completionCriteria: { type: 'view_all', threshold: 100 }
    },
    {
      title: 'Data-Driven Instruction',
      description: 'Using analytics to inform teaching decisions',
      category: 'data_analysis',
      targetAudience: ['teacher', 'admin'],
      content: [
        { type: 'video', title: 'Analytics Dashboard Tour', duration: 20, order: 1 },
        { type: 'interactive', title: 'Interpreting Student Data', duration: 25, order: 2 },
        { type: 'document', title: 'Intervention Strategies', duration: 15, order: 3 }
      ],
      learningObjectives: [
        'Read and interpret student performance data',
        'Identify at-risk students',
        'Plan data-informed interventions'
      ],
      estimatedDuration: 60,
      completionCriteria: { type: 'view_all', threshold: 100 }
    },
    {
      title: 'FERPA and Student Data Privacy',
      description: 'Compliance training for handling student educational records',
      category: 'compliance',
      targetAudience: ['teacher', 'admin', 'district_admin'],
      content: [
        { type: 'video', title: 'FERPA Fundamentals', duration: 20, order: 1 },
        { type: 'document', title: 'BCPS Data Handling Policy', duration: 15, order: 2 },
        { type: 'quiz', title: 'Compliance Assessment', duration: 15, order: 3 }
      ],
      learningObjectives: [
        'Understand FERPA requirements',
        'Properly handle student data',
        'Respond to data access requests'
      ],
      estimatedDuration: 50,
      completionCriteria: { type: 'quiz_pass', threshold: 90 },
      certificateEnabled: true
    },
    {
      title: 'Assessment Design and Grading',
      description: 'Creating effective assessments and using grading tools',
      category: 'assessment',
      targetAudience: ['teacher', 'instructor'],
      content: [
        { type: 'video', title: 'Assessment Types', duration: 20, order: 1 },
        { type: 'interactive', title: 'Building a Quiz', duration: 30, order: 2 },
        { type: 'document', title: 'Rubrics and Standards', duration: 15, order: 3 },
        { type: 'quiz', title: 'Assessment Knowledge', duration: 10, order: 4 }
      ],
      learningObjectives: [
        'Create various assessment types',
        'Align assessments with standards',
        'Use gradebook effectively'
      ],
      estimatedDuration: 75,
      completionCriteria: { type: 'quiz_pass', threshold: 80 }
    }
  ];
  
  for (const moduleData of defaultModules) {
    const exists = await PDModule.findOne({ title: moduleData.title });
    if (!exists) {
      await createModule(moduleData);
    }
  }
};

export default {
  getModulesForUser,
  getModuleDetails,
  updateModuleProgress,
  submitQuiz,
  createModule,
  updateModule,
  getPDAnalytics,
  createDefaultModules,
  PDModule,
  UserPDProgress
};
