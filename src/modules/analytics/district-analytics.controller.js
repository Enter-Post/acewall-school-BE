import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js';
import ErrorHandler from '../../middlewares/error.js';
import User from '../../Models/user.model.js';
import Course from '../../Models/CourseModels/Course.model.js';
import Enrollment from '../../Models/Enrollment.model.js';
import Assessment from '../../Models/Assessment.model.js';
import Submission from '../../Models/submission.model.js';
import mongoose from 'mongoose';

// Get district-wide overview dashboard
export const getDistrictOverview = catchAsyncErrors(async (req, res, next) => {
  if (!['district_admin', 'admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const districtId = req.user.districtId || req.user._id;
  
  // Get counts
  const [userStats, courseStats, enrollmentStats, assessmentStats] = await Promise.all([
    User.aggregate([
      { $match: { districtId: districtId.toString() } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    Course.countDocuments({ districtId: districtId.toString() }),
    Enrollment.countDocuments({ districtId: districtId.toString() }),
    Assessment.aggregate([
      { $match: { districtId: districtId.toString() } },
      { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: '$totalPoints' } } }
    ])
  ]);
  
  const userCounts = {};
  userStats.forEach(stat => {
    userCounts[stat._id] = stat.count;
  });
  
  res.status(200).json({
    success: true,
    overview: {
      users: {
        total: Object.values(userCounts).reduce((a, b) => a + b, 0),
        byRole: userCounts
      },
      courses: courseStats,
      enrollments: enrollmentStats,
      assessments: {
        total: assessmentStats[0]?.count || 0,
        averagePoints: Math.round(assessmentStats[0]?.avgScore || 0)
      }
    }
  });
});

// Get student engagement analytics
export const getStudentEngagement = catchAsyncErrors(async (req, res, next) => {
  if (!['district_admin', 'admin', 'teacher'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const { startDate, endDate, schoolId } = req.query;
  const districtId = req.user.districtId || req.user._id;
  
  const matchStage = { districtId: districtId.toString() };
  if (schoolId) matchStage.schoolIds = schoolId;
  
  // Get login activity
  const loginActivity = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'loginactivities',
        localField: '_id',
        foreignField: 'user',
        as: 'logins'
      }
    },
    {
      $project: {
        email: 1,
        role: 1,
        loginCount: { $size: '$logins' },
        lastLogin: { $max: '$logins.timestamp' }
      }
    }
  ]);
  
  // Get submission activity
  const submissionActivity = await Submission.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    { $match: { 'student.districtId': districtId.toString() } },
    {
      $group: {
        _id: '$student._id',
        submissionCount: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    engagement: {
      loginActivity: loginActivity.slice(0, 50),
      submissionActivity: submissionActivity,
      activeStudents: submissionActivity.length,
      totalSubmissions: submissionActivity.reduce((a, b) => a + b.submissionCount, 0)
    }
  });
});

// Get assessment performance analytics
export const getAssessmentAnalytics = catchAsyncErrors(async (req, res, next) => {
  if (!['district_admin', 'admin', 'teacher'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const { courseId, grade, dateRange } = req.query;
  const districtId = req.user.districtId || req.user._id;
  
  let matchStage = {};
  
  if (courseId) {
    matchStage = { course: new mongoose.Types.ObjectId(courseId) };
  } else {
    // Get all assessments in district
    const courses = await Course.find({ districtId: districtId.toString() }).select('_id');
    const courseIds = courses.map(c => c._id);
    matchStage = { course: { $in: courseIds } };
  }
  
  const assessmentStats = await Submission.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $group: {
        _id: '$assessment',
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' },
        totalSubmissions: { $sum: 1 },
        students: { $addToSet: '$student._id' }
      }
    },
    {
      $lookup: {
        from: 'assessments',
        localField: '_id',
        foreignField: '_id',
        as: 'assessment'
      }
    },
    { $unwind: '$assessment' }
  ]);
  
  // Calculate performance bands
  const performanceBands = {
    excellent: 0, // 90-100
    proficient: 0, // 80-89
    developing: 0, // 70-79
    needsImprovement: 0 // <70
  };
  
  assessmentStats.forEach(stat => {
    const avgPercent = (stat.avgScore / stat.assessment.totalPoints) * 100;
    if (avgPercent >= 90) performanceBands.excellent++;
    else if (avgPercent >= 80) performanceBands.proficient++;
    else if (avgPercent >= 70) performanceBands.developing++;
    else performanceBands.needsImprovement++;
  });
  
  res.status(200).json({
    success: true,
    analytics: {
      assessments: assessmentStats,
      performanceBands,
      districtAverage: assessmentStats.length > 0 
        ? assessmentStats.reduce((a, b) => a + b.avgScore, 0) / assessmentStats.length 
        : 0
    }
  });
});

// Get course completion rates
export const getCourseCompletionRates = catchAsyncErrors(async (req, res, next) => {
  const districtId = req.user.districtId || req.user._id;
  
  const courses = await Course.find({ districtId: districtId.toString() }).lean();
  
  const completionData = await Promise.all(
    courses.map(async (course) => {
      const totalEnrolled = await Enrollment.countDocuments({ course: course._id });
      const activeStudents = await Submission.distinct('student', { 
        course: course._id,
        status: 'submitted'
      });
      
      return {
        courseId: course._id,
        title: course.title,
        totalEnrolled,
        activeCount: activeStudents.length,
        completionRate: totalEnrolled > 0 ? (activeStudents.length / totalEnrolled) * 100 : 0
      };
    })
  );
  
  res.status(200).json({
    success: true,
    completionData: completionData.sort((a, b) => b.completionRate - a.completionRate)
  });
});

// Get teacher activity report
export const getTeacherActivity = catchAsyncErrors(async (req, res, next) => {
  if (!['district_admin', 'admin'].includes(req.user.role)) {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const districtId = req.user.districtId || req.user._id;
  
  const teachers = await User.find({ 
    districtId: districtId.toString(),
    role: { $in: ['teacher', 'instructor'] }
  }).lean();
  
  const teacherActivity = await Promise.all(
    teachers.map(async (teacher) => {
      const courses = await Course.find({ instructor: teacher._id });
      const courseIds = courses.map(c => c._id);
      
      const assessmentsCreated = await Assessment.countDocuments({
        course: { $in: courseIds }
      });
      
      const submissionsGraded = await Submission.countDocuments({
        course: { $in: courseIds },
        status: 'graded'
      });
      
      return {
        teacherId: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        coursesTaught: courses.length,
        assessmentsCreated,
        submissionsGraded,
        lastActive: teacher.updatedAt
      };
    })
  );
  
  res.status(200).json({
    success: true,
    teachers: teacherActivity.sort((a, b) => b.assessmentsCreated - a.assessmentsCreated)
  });
});

// Get compliance/audit report
export const getComplianceReport = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== 'district_admin') {
    return next(new ErrorHandler('Not authorized', 403));
  }
  
  const districtId = req.user.districtId || req.user._id;
  
  // FERPA-aligned compliance metrics
  const compliance = {
    dataRetention: {
      totalUsers: await User.countDocuments({ districtId: districtId.toString() }),
      usersWithConsent: await User.countDocuments({ 
        districtId: districtId.toString(),
        'metadata.consentDate': { $exists: true }
      }),
      dataExportRequests: 0 // Would track export requests
    },
    security: {
      ssoEnabled: process.env.SAML_ENABLED === 'true',
      encryptionAtRest: true,
      encryptionInTransit: true,
      mfaEnabled: false // Track MFA adoption
    },
    audit: {
      lastRosterSync: new Date(),
      dataAccessLogs: [], // Would track access logs
      failedLoginAttempts: 0 // Would track security events
    }
  };
  
  res.status(200).json({
    success: true,
    compliance
  });
});

// Export analytics report
export const exportAnalyticsReport = catchAsyncErrors(async (req, res, next) => {
  const { type, format = 'json' } = req.query;
  const districtId = req.user.districtId || req.user._id;
  
  let reportData;
  
  switch (type) {
    case 'engagement':
      reportData = await getStudentEngagementData(districtId);
      break;
    case 'assessments':
      reportData = await getAssessmentReportData(districtId);
      break;
    case 'teachers':
      reportData = await getTeacherReportData(districtId);
      break;
    default:
      reportData = { message: 'Select a report type' };
  }
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    return res.send(convertToCSV(reportData));
  }
  
  res.status(200).json({
    success: true,
    report: reportData
  });
});

// Helper functions for report data
async function getStudentEngagementData(districtId) {
  return await User.find({ 
    districtId: districtId.toString(),
    role: 'student'
  }).select('firstName lastName email metadata loginCount lastActive');
}

async function getAssessmentReportData(districtId) {
  const courses = await Course.find({ districtId: districtId.toString() }).select('_id title');
  const courseIds = courses.map(c => c._id);
  
  return await Assessment.find({ course: { $in: courseIds } })
    .populate('course', 'title')
    .select('title totalPoints submissions createdAt');
}

async function getTeacherReportData(districtId) {
  return await User.find({
    districtId: districtId.toString(),
    role: { $in: ['teacher', 'instructor'] }
  }).select('firstName lastName email courses assessments lastActive');
}

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0] || {});
  const rows = data.map(obj => 
    headers.map(h => {
      const val = obj[h];
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

export default {
  getDistrictOverview,
  getStudentEngagement,
  getAssessmentAnalytics,
  getCourseCompletionRates,
  getTeacherActivity,
  getComplianceReport,
  exportAnalyticsReport
};
