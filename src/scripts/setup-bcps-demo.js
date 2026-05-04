import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../Models/user.model.js';
import Course from '../Models/CourseModels/Course.model.js';
import Enrollment from '../Models/Enrollment.model.js';
import Assessment from '../Models/Assessment.model.js';
import { PDModule } from '../modules/professional-development/pd.service.js';
import { createDefaultModules } from '../modules/professional-development/pd.service.js';

// Demo data for BCPS RFI
const DEMO_DISTRICT_ID = 'bcps-demo-2026';

// Demo users
const demoUsers = [
  {
    email: 'bcps-demo-admin@acewallscholars.org',
    password: 'DemoAdmin2026!',
    firstName: 'BCPS',
    lastName: 'Administrator',
    role: 'district_admin',
    districtId: DEMO_DISTRICT_ID
  },
  {
    email: 'bcps-demo-teacher@acewallscholars.org',
    password: 'DemoTeacher2026!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'teacher',
    districtId: DEMO_DISTRICT_ID
  },
  {
    email: 'bcps-demo-student@acewallscholars.org',
    password: 'DemoStudent2026!',
    firstName: 'Marcus',
    lastName: 'Williams',
    role: 'student',
    districtId: DEMO_DISTRICT_ID,
    grade: '7'
  },
  {
    email: 'bcps-demo-parent@acewallscholars.org',
    password: 'DemoParent2026!',
    firstName: 'Jennifer',
    lastName: 'Williams',
    role: 'parent',
    districtId: DEMO_DISTRICT_ID
  }
];

// Demo social studies courses for BCPS Grades 6-8
const demoCourses = [
  {
    title: 'Grade 6: World Geography & Early Civilizations',
    description: 'Explore ancient civilizations including Mesopotamia, Egypt, India, and China. Develop geography skills and understand cultural development.',
    subject: 'Social Studies',
    gradeLevel: '6',
    courseCode: 'SS-06-GEO',
    topics: [
      { title: 'Unit 1: Geography Skills & Map Reading', order: 1 },
      { title: 'Unit 2: Ancient Mesopotamia', order: 2 },
      { title: 'Unit 3: Ancient Egypt', order: 3 },
      { title: 'Unit 4: Ancient India', order: 4 },
      { title: 'Unit 5: Ancient China', order: 5 }
    ]
  },
  {
    title: 'Grade 7: World History',
    description: 'Study medieval civilizations, the Renaissance, Reformation, and the Age of Exploration.',
    subject: 'Social Studies',
    gradeLevel: '7',
    courseCode: 'SS-07-HIS',
    topics: [
      { title: 'Unit 1: Medieval Europe & Feudalism', order: 1 },
      { title: 'Unit 2: Medieval Asia & Africa', order: 2 },
      { title: 'Unit 3: The Renaissance', order: 3 },
      { title: 'Unit 4: The Reformation', order: 4 },
      { title: 'Unit 5: Age of Exploration', order: 5 }
    ]
  },
  {
    title: 'Grade 8: U.S. History & Government',
    description: 'Study the foundations of America, the Constitution, and modern civic understanding aligned with Government MCAP preparation.',
    subject: 'Social Studies',
    gradeLevel: '8',
    courseCode: 'SS-08-USGOV',
    topics: [
      { title: 'Unit 1: Foundations of American Democracy', order: 1 },
      { title: 'Unit 2: The Constitution & Bill of Rights', order: 2 },
      { title: 'Unit 3: Federalism & Government Structure', order: 3 },
      { title: 'Unit 4: Civil War & Reconstruction', order: 4 },
      { title: 'Unit 5: Modern Civic Participation', order: 5 },
      { title: 'Unit 6: MCAP Government Review', order: 6 }
    ]
  }
];

// Demo assessments aligned with MCAP
const demoAssessments = [
  {
    title: 'Geography Skills Assessment',
    type: 'quiz',
    totalPoints: 50,
    duration: 30,
    standards: ['6.1.1', '6.1.2']
  },
  {
    title: 'Ancient Civilizations Unit Test',
    type: 'test',
    totalPoints: 100,
    duration: 60,
    standards: ['6.2.1', '6.2.2', '6.2.3']
  },
  {
    title: 'Medieval Europe Project',
    type: 'project',
    totalPoints: 75,
    duration: 0,
    standards: ['7.1.1', '7.1.2']
  },
  {
    title: 'Renaissance & Reformation Exam',
    type: 'exam',
    totalPoints: 100,
    duration: 90,
    standards: ['7.3.1', '7.4.1']
  },
  {
    title: 'Constitution Knowledge Check',
    type: 'quiz',
    totalPoints: 40,
    duration: 25,
    standards: ['8.2.1', '8.2.2']
  },
  {
    title: 'Government MCAP Practice Test',
    type: 'exam',
    totalPoints: 100,
    duration: 120,
    standards: ['8.GOV.1', '8.GOV.2', '8.GOV.3']
  }
];

// Setup function
export const setupBCPSDemo = async () => {
  try {
    console.log('Setting up BCPS Demo Environment...');
    
    // Clean existing demo data
    await cleanupDemoData();
    
    // Create demo users
    const createdUsers = await createDemoUsers();
    console.log(`Created ${createdUsers.length} demo users`);
    
    // Create demo courses
    const createdCourses = await createDemoCourses(createdUsers);
    console.log(`Created ${createdCourses.length} demo courses`);
    
    // Create demo enrollments
    const enrollments = await createDemoEnrollments(createdUsers, createdCourses);
    console.log(`Created ${enrollments.length} enrollments`);
    
    // Create demo assessments
    const assessments = await createDemoAssessments(createdCourses, createdUsers);
    console.log(`Created ${assessments.length} assessments`);
    
    // Create default PD modules
    await createDefaultModules();
    console.log('Created default PD modules');
    
    console.log('\n=== BCPS Demo Setup Complete ===');
    console.log('Demo Credentials:');
    createdUsers.forEach(user => {
      console.log(`  ${user.role}: ${user.email} / [demo password]`);
    });
    
    return {
      success: true,
      users: createdUsers,
      courses: createdCourses,
      enrollments,
      assessments
    };
  } catch (error) {
    console.error('Demo setup error:', error);
    return { success: false, error: error.message };
  }
};

// Cleanup existing demo data
const cleanupDemoData = async () => {
  await User.deleteMany({ districtId: DEMO_DISTRICT_ID });
  await Course.deleteMany({ districtId: DEMO_DISTRICT_ID });
  await Enrollment.deleteMany({ districtId: DEMO_DISTRICT_ID });
  await Assessment.deleteMany({ districtId: DEMO_DISTRICT_ID });
  console.log('Cleaned existing demo data');
};

// Create demo users
const createDemoUsers = async () => {
  const createdUsers = [];
  
  for (const userData of demoUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      isEmailVerified: true,
      externalId: `demo-${userData.role}`,
      metadata: {
        source: 'bcps-demo',
        demoAccount: true
      }
    });
    
    createdUsers.push({
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });
  }
  
  return createdUsers;
};

// Create demo courses
const createDemoCourses = async (users) => {
  const teacher = users.find(u => u.role === 'teacher');
  const createdCourses = [];
  
  for (const courseData of demoCourses) {
    const course = await Course.create({
      ...courseData,
      instructor: teacher.id,
      districtId: DEMO_DISTRICT_ID,
      status: 'published',
      externalId: `demo-${courseData.courseCode}`,
      isActive: true
    });
    
    createdCourses.push({
      id: course._id,
      title: course.title,
      courseCode: course.courseCode,
      gradeLevel: course.gradeLevel
    });
  }
  
  return createdCourses;
};

// Create demo enrollments
const createDemoEnrollments = async (users, courses) => {
  const student = users.find(u => u.role === 'student');
  const enrollments = [];
  
  for (const course of courses) {
    const enrollment = await Enrollment.create({
      student: student.id,
      course: course.id,
      districtId: DEMO_DISTRICT_ID,
      status: 'active',
      role: 'student',
      enrolledAt: new Date()
    });
    
    enrollments.push(enrollment._id);
  }
  
  return enrollments;
};

// Create demo assessments
const createDemoAssessments = async (courses, users) => {
  const teacher = users.find(u => u.role === 'teacher');
  const assessments = [];
  
  // Assign assessments to appropriate courses
  const courseMap = {
    'Grade 6': courses.find(c => c.gradeLevel === '6'),
    'Grade 7': courses.find(c => c.gradeLevel === '7'),
    'Grade 8': courses.find(c => c.gradeLevel === '8')
  };
  
  for (const assessmentData of demoAssessments) {
    let targetCourse;
    if (assessmentData.title.includes('Geography') || assessmentData.title.includes('Ancient')) {
      targetCourse = courseMap['Grade 6'];
    } else if (assessmentData.title.includes('Medieval') || assessmentData.title.includes('Renaissance')) {
      targetCourse = courseMap['Grade 7'];
    } else {
      targetCourse = courseMap['Grade 8'];
    }
    
    if (targetCourse) {
      const assessment = await Assessment.create({
        ...assessmentData,
        course: targetCourse.id,
        instructor: teacher.id,
        districtId: DEMO_DISTRICT_ID,
        status: 'published',
        settings: {
          timeLimit: assessmentData.duration,
          attemptsAllowed: 2,
          showCorrectAnswers: true,
          randomizeQuestions: false
        }
      });
      
      assessments.push(assessment._id);
    }
  }
  
  return assessments;
};

// CLI execution
if (process.argv.includes('--setup')) {
  // Connect to MongoDB
  const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('MONGODB_URI not set');
      process.exit(1);
    }
    
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
      
      const result = await setupBCPSDemo();
      
      if (result.success) {
        console.log('\nDemo environment ready!');
      } else {
        console.error('Setup failed:', result.error);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  };
  
  connectDB();
}

export default setupBCPSDemo;
