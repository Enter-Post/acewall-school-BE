import csv from 'csv-parser';
import fs from 'fs';
import User from '../../Models/user.model.js';
import Course from '../../Models/CourseModels/Course.model.js';
import Enrollment from '../../Models/Enrollment.model.js';
import mongoose from 'mongoose';

// OneRoster CSV field mappings
const ONE_ROSTER_FIELDS = {
  users: ['sourcedId', 'orgSourcedIds', 'roles', 'username', 'userIds', 'givenName', 'familyName', 'identifier', 'email', 'sms', 'phone', 'agentSourcedIds', 'grades', 'password', 'metadata'],
  classes: ['sourcedId', 'schoolSourcedId', 'termSourcedIds', 'courseSourcedId', 'classCode', 'classType', 'location', 'grades', 'subjects', 'courseCode', 'period', 'metadata'],
  enrollments: ['sourcedId', 'classSourcedId', 'schoolSourcedId', 'userSourcedId', 'role', 'primary', 'beginDate', 'endDate', 'metadata'],
  courses: ['sourcedId', 'schoolYearSourcedId', 'title', 'courseCode', 'grades', 'subjects', 'orgSourcedId', 'metadata'],
  orgs: ['sourcedId', 'name', 'type', 'identifier', 'parentSourcedId', 'metadata'],
  demographics: ['sourcedId', 'birthDate', 'sex', 'americanIndianOrAlaskaNative', 'asian', 'blackOrAfricanAmerican', 'nativeHawaiianOrOtherPacificIslander', 'white', 'demographicRaceTwoOrMoreRaces', 'hispanicOrLatinoEthnicity', 'countryOfBirthCode', 'stateOfBirthAbbreviation', 'cityOfBirth', 'publicSchoolResidenceStatus', 'metadata'],
  academicSessions: ['sourcedId', 'title', 'startDate', 'endDate', 'type', 'schoolYear', 'metadata']
};

// Parse OneRoster CSV file
export const parseOneRosterCSV = async (filePath, entityType) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Import users from OneRoster
export const importUsersFromOneRoster = async (usersData, districtId) => {
  const imported = [];
  const errors = [];
  
  for (const userData of usersData) {
    try {
      // Map OneRoster role to LMS role
      const role = mapOneRosterRole(userData.roles);
      
      // Build user object
      const userDoc = {
        firstName: userData.givenName,
        lastName: userData.familyName,
        email: userData.email || `${userData.username}@bcps.edu`,
        role: role,
        districtId: districtId,
        schoolIds: userData.orgSourcedIds ? userData.orgSourcedIds.split(',').map(id => id.trim()) : [],
        externalId: userData.sourcedId,
        authProvider: 'oneroster',
        isEmailVerified: true,
        metadata: {
          grades: userData.grades ? userData.grades.split(',') : [],
          phone: userData.phone || userData.sms,
          source: 'OneRoster'
        }
      };
      
      // Check if user exists
      let user = await User.findOne({ 
        $or: [
          { externalId: userData.sourcedId },
          { email: userDoc.email }
        ]
      });
      
      if (user) {
        // Update existing user
        Object.assign(user, userDoc);
        await user.save();
      } else {
        // Create new user
        user = await User.create(userDoc);
      }
      
      imported.push({ id: user._id, email: user.email, action: user ? 'updated' : 'created' });
    } catch (error) {
      errors.push({ user: userData.sourcedId, error: error.message });
    }
  }
  
  return { imported, errors, count: imported.length };
};

// Import classes/courses from OneRoster
export const importClassesFromOneRoster = async (classesData, coursesData, districtId) => {
  const imported = [];
  const errors = [];
  
  for (const classData of classesData) {
    try {
      // Find matching course
      const course = coursesData.find(c => c.sourcedId === classData.courseSourcedId);
      
      const courseDoc = {
        title: course?.title || classData.subjects || 'Untitled Course',
        description: `Grade ${classData.grades} - ${classData.subjects}`,
        externalId: classData.sourcedId,
        districtId: districtId,
        schoolId: classData.schoolSourcedId,
        courseCode: classData.courseCode || classData.classCode,
        gradeLevel: classData.grades,
        metadata: {
          period: classData.period,
          location: classData.location,
          classType: classData.classType,
          termSourcedIds: classData.termSourcedIds,
          source: 'OneRoster'
        }
      };
      
      let existingCourse = await Course.findOne({ externalId: classData.sourcedId });
      
      if (existingCourse) {
        Object.assign(existingCourse, courseDoc);
        await existingCourse.save();
      } else {
        existingCourse = await Course.create(courseDoc);
      }
      
      imported.push({ id: existingCourse._id, title: existingCourse.title });
    } catch (error) {
      errors.push({ class: classData.sourcedId, error: error.message });
    }
  }
  
  return { imported, errors, count: imported.length };
};

// Import enrollments from OneRoster
export const importEnrollmentsFromOneRoster = async (enrollmentsData, districtId) => {
  const imported = [];
  const errors = [];
  
  for (const enrollmentData of enrollmentsData) {
    try {
      // Find user by externalId
      const user = await User.findOne({ externalId: enrollmentData.userSourcedId });
      if (!user) {
        errors.push({ enrollment: enrollmentData.sourcedId, error: 'User not found' });
        continue;
      }
      
      // Find class/course by externalId
      const course = await Course.findOne({ externalId: enrollmentData.classSourcedId });
      if (!course) {
        errors.push({ enrollment: enrollmentData.sourcedId, error: 'Course not found' });
        continue;
      }
      
      // Check if enrollment exists
      let enrollment = await Enrollment.findOne({
        student: user._id,
        course: course._id
      });
      
      const enrollmentDoc = {
        student: user._id,
        course: course._id,
        role: enrollmentData.role === 'teacher' ? 'instructor' : 'student',
        isPrimary: enrollmentData.primary === 'true',
        externalId: enrollmentData.sourcedId,
        startDate: enrollmentData.beginDate,
        endDate: enrollmentData.endDate,
        districtId: districtId,
        metadata: {
          source: 'OneRoster'
        }
      };
      
      if (enrollment) {
        Object.assign(enrollment, enrollmentDoc);
        await enrollment.save();
      } else {
        enrollment = await Enrollment.create(enrollmentDoc);
      }
      
      imported.push({ 
        id: enrollment._id, 
        student: user.email, 
        course: course.title,
        role: enrollmentDoc.role
      });
    } catch (error) {
      errors.push({ enrollment: enrollmentData.sourcedId, error: error.message });
    }
  }
  
  return { imported, errors, count: imported.length };
};

// Handle name changes
export const handleNameChange = async (externalId, newGivenName, newFamilyName) => {
  const user = await User.findOne({ externalId });
  if (user) {
    user.firstName = newGivenName;
    user.lastName = newFamilyName;
    await user.save();
    return { updated: true, user: user._id };
  }
  return { updated: false, error: 'User not found' };
};

// Handle school transfers
export const handleSchoolTransfer = async (externalId, newSchoolIds) => {
  const user = await User.findOne({ externalId });
  if (user) {
    user.schoolIds = newSchoolIds;
    await user.save();
    return { updated: true, user: user._id };
  }
  return { updated: false, error: 'User not found' };
};

// Export roster data
export const exportRosterData = async (districtId, options = {}) => {
  const { orgSourcedId, role, includeDemographics } = options;
  
  let query = { districtId: districtId };
  if (orgSourcedId) query.schoolIds = { $in: [orgSourcedId] };
  if (role) query.role = role;
  
  const users = await User.find(query).lean();
  
  return users.map(user => ({
    sourcedId: user.externalId || user._id.toString(),
    orgSourcedIds: user.schoolIds?.join(',') || '',
    roles: user.role,
    username: user.email.split('@')[0],
    givenName: user.firstName,
    familyName: user.lastName,
    email: user.email,
    grades: user.metadata?.grades?.join(',') || ''
  }));
};

// Role mapping from OneRoster to LMS
const mapOneRosterRole = (onerosterRoles) => {
  const roleMap = {
    'student': 'student',
    'teacher': 'teacher',
    'administrator': 'admin',
    'districtAdministrator': 'district_admin',
    'parent': 'parent',
    'guardian': 'parent',
    'aide': 'instructor',
    'substitute': 'instructor'
  };
  
  if (!onerosterRoles) return 'student';
  
  const roles = onerosterRoles.toLowerCase().split(',');
  for (const role of roles) {
    const trimmed = role.trim();
    if (roleMap[trimmed]) return roleMap[trimmed];
  }
  
  return 'student';
};

export default {
  parseOneRosterCSV,
  importUsersFromOneRoster,
  importClassesFromOneRoster,
  importEnrollmentsFromOneRoster,
  handleNameChange,
  handleSchoolTransfer,
  exportRosterData
};
