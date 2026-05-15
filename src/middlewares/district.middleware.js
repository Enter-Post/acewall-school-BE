/**
 * District Middleware
 * Enforces district isolation and school-level access control
 */

import { ROLES, isAdminRole } from "../modules/rbac/roles.js";
import School from "../Models/school.model.js";
import mongoose from "mongoose";

/**
 * Middleware: Verify user can access the requested district
 * Super admin can access all districts
 * District admin can only access their own district
 * Other users can only access resources in their assigned district
 */
export const verifyDistrictAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    const { districtId } = req.params;
    const { body } = req;
    const targetDistrictId = districtId || body?.districtId || req.query?.districtId;

    // Super admin can access all districts
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // If no target district specified, use user's district (for create operations)
    if (!targetDistrictId) {
      // For create operations without explicit district, use user's district
      if (req.method === "POST") {
        req.body.districtId = req.user.districtId;
        return next();
      }
      return res.status(400).json({
        error: true,
        message: "District ID required",
      });
    }

    // Check if user belongs to the target district
    if (req.user.districtId !== targetDistrictId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: cannot access resources in another district",
        userDistrict: req.user.districtId,
        requestedDistrict: targetDistrictId,
      });
    }

    next();
  } catch (error) {
    console.error("Error in verifyDistrictAccess middleware:", error);
    return res.status(500).json({
      error: true,
      message: "District access verification failed",
    });
  }
};

/**
 * Middleware: Verify user can access the requested school
 * Checks school belongs to user's district
 * For multi-school teachers, checks school is in their schoolId
 */
export const verifySchoolAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    const { schoolId } = req.params;
    const targetSchoolId = schoolId || req.body?.schoolId || req.query?.schoolId;

    // Super admin can access any school
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // If no school specified, allow (some endpoints don't require school)
    if (!targetSchoolId) {
      return next();
    }

    // Find the school
    const school = await School.findById(targetSchoolId);

    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check if school belongs to user's district
    if (school.districtId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // For teachers, check if school is in their assigned schools
    if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
      const userSchoolId = req.user.schoolId;
      const schoolIdString = targetSchoolId.toString();
      
      // If teacher has specific schools assigned, check access
      if (userSchoolId && userSchoolId.toString() !== schoolIdString) {
        return res.status(403).json({
          error: true,
          message: "Access denied: school not assigned to you",
          assignedSchool: userSchoolId,
        });
      }
    }

    // Attach school to request for use in controllers
    req.school = school;

    next();
  } catch (error) {
    console.error("Error in verifySchoolAccess middleware:", error);
    return res.status(500).json({
      error: true,
      message: "School access verification failed",
    });
  }
};

/**
 * Middleware: Add district filter to query
 * Automatically filters MongoDB queries by user's district
 * Use this for list endpoints
 */
export const addDistrictFilter = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin sees all, others filtered by district
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      req.districtFilter = { districtId: req.user.districtId };
    } else {
      req.districtFilter = {};
    }

    next();
  } catch (error) {
    console.error("Error in addDistrictFilter middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to add district filter",
    });
  }
};

/**
 * Middleware: Ensure user can only create resources in their district
 * Validates districtId in request body matches user's district
 */
export const enforceDistrictCreation = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin can create in any district
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const bodyDistrictId = req.body?.districtId;

    // If no district specified, auto-assign user's district
    if (!bodyDistrictId) {
      req.body.districtId = req.user.districtId;
      return next();
    }

    // If district specified, verify it matches user's district
    if (bodyDistrictId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Cannot create resources in another district",
        yourDistrict: req.user.districtId,
        requestedDistrict: bodyDistrictId,
      });
    }

    next();
  } catch (error) {
    console.error("Error in enforceDistrictCreation middleware:", error);
    return res.status(500).json({
      error: true,
      message: "District creation enforcement failed",
    });
  }
};

/**
 * Middleware: Restrict district admin to their district only
 * More strict than general district access - for district_admin role
 */
export const restrictToOwnDistrict = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // District admin must have a district assigned
    if (!req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "No district assigned to your account",
      });
    }

    // All operations are restricted to user's district
    req.restrictedDistrictId = req.user.districtId;

    next();
  } catch (error) {
    console.error("Error in restrictToOwnDistrict middleware:", error);
    return res.status(500).json({
      error: true,
      message: "District restriction failed",
    });
  }
};

/**
 * Helper function: Build MongoDB query with district filter
 * @param {Object} req - Express request
 * @param {Object} baseQuery - Base query object
 * @returns {Object} Query with district filter applied
 */
export const buildDistrictQuery = (req, baseQuery = {}) => {
  if (!req.user) return baseQuery;

  // Super admin sees all
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return baseQuery;
  }

  // Add district filter
  return {
    ...baseQuery,
    districtId: req.user.districtId,
  };
};

/**
 * Helper function: Check if user can access a specific district
 * @param {Object} req - Express request
 * @param {string} districtId - District ID to check
 * @returns {boolean}
 */
export const canAccessDistrict = (req, districtId) => {
  if (!req.user) return false;
  if (req.user.role === ROLES.SUPER_ADMIN) return true;
  return req.user.districtId === districtId;
};

/**
 * Helper function: Check if user can access a specific school
 * @param {Object} req - Express request
 * @param {string} schoolId - School ID to check
 * @param {string} schoolDistrictId - District ID the school belongs to
 * @returns {boolean}
 */
export const canAccessSchool = (req, schoolId, schoolDistrictId) => {
  if (!req.user) return false;
  if (req.user.role === ROLES.SUPER_ADMIN) return true;

  // Check district match
  if (req.user.districtId !== schoolDistrictId) return false;

  // For teachers, check school assignment
  if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
    const userSchoolId = req.user.schoolId;
    if (userSchoolId && userSchoolId.toString() !== schoolId.toString()) {
      return false;
    }
  }

  return true;
};

/**
 * Middleware: Restrict students to their own school only
 * Students can only access resources from their assigned school
 * District admins can access any school in their district
 * Teachers can access their assigned schools only
 */
export const restrictToOwnSchool = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin can access any school
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const { schoolId } = req.params;
    const targetSchoolId = schoolId || req.body?.schoolId || req.query?.schoolId;

    // If no school specified, add school filter to request
    if (!targetSchoolId) {
      if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.TEACHER_AS_STUDENT) {
        // Students can only see their own school
        req.schoolFilter = { schoolId: req.user.schoolId };
      } else if (req.user.role === ROLES.DISTRICT_ADMIN) {
        // District admins can see all schools in their district
        req.schoolFilter = {}; // Will be combined with district filter
      } else if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
        // Teachers can see their assigned schools
        const userSchoolId = req.user.schoolId;
        if (userSchoolId) {
          req.schoolFilter = { schoolId: userSchoolId };
        } else {
          req.schoolFilter = {};
        }
      }
      return next();
    }

    // Find the school to verify it exists and get district info
    const school = await School.findById(targetSchoolId);
    if (!school) {
      return res.status(404).json({
        error: true,
        message: "School not found",
      });
    }

    // Check district access first
    if (req.user.districtId !== school.districtId) {
      return res.status(403).json({
        error: true,
        message: "Access denied: school not in your district",
      });
    }

    // Student: can only access their own school
    if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.TEACHER_AS_STUDENT) {
      const userSchoolId = req.user.schoolId;
      if (userSchoolId?.toString() !== targetSchoolId.toString()) {
        return res.status(403).json({
          error: true,
          message: "Access denied: students can only access their own school",
        });
      }
    }

    // Teacher: can only access their assigned schools
    if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
      const userSchoolId = req.user.schoolId;
      if (userSchoolId && userSchoolId.toString() !== targetSchoolId.toString()) {
        return res.status(403).json({
          error: true,
          message: "Access denied: school not assigned to you",
        });
      }
    }

    // District admin: can access any school in their district (already checked above)
    // Super admin: already bypassed above

    req.school = school;
    next();
  } catch (error) {
    console.error("Error in restrictToOwnSchool middleware:", error);
    return res.status(500).json({
      error: true,
      message: "School access verification failed",
    });
  }
};

/**
 * Middleware: Prevent any cross-district access
 * Blocks all attempts to access resources across district boundaries
 * Applies to all user roles except super_admin
 */
export const preventCrossDistrictAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin can access all districts
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const { districtId } = req.params;
    const { body } = req;
    const targetDistrictId = districtId || body?.districtId || req.query?.districtId;

    // If accessing a specific district, verify it's user's district
    if (targetDistrictId && targetDistrictId !== req.user.districtId) {
      return res.status(403).json({
        error: true,
        message: "Cross-district access not permitted",
        userDistrict: req.user.districtId,
        requestedDistrict: targetDistrictId,
      });
    }

    // For course-related resources, check the course's district
    if (req.params.courseId || body?.course) {
      const courseId = req.params.courseId || body?.course;
      try {
        const CourseSch = mongoose.model("CourseSch");
        const course = await CourseSch.findById(courseId);
        
        if (course && course.districtId !== req.user.districtId) {
          return res.status(403).json({
            error: true,
            message: "Cross-district access not permitted",
            userDistrict: req.user.districtId,
            courseDistrict: course.districtId,
          });
        }
      } catch (err) {
        // Course model not found or other error - continue but log
        console.warn("Could not verify course district:", err.message);
      }
    }

    // Add district filter to prevent cross-district queries
    req.districtFilter = { districtId: req.user.districtId };

    next();
  } catch (error) {
    console.error("Error in preventCrossDistrictAccess middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Cross-district access prevention failed",
    });
  }
};

/**
 * Middleware: Enforce school-specific course creation for teachers
 * Teachers must specify which school they're creating the course for
 * Course is locked to that specific school
 */
export const enforceCourseSchoolCreation = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin can create courses for any school
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const { schoolId } = req.body;

    // For teachers and instructors, schoolId is required
    if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
      if (!schoolId) {
        return res.status(400).json({
          error: true,
          message: "School ID is required when creating a course",
        });
      }

      // Verify the school exists and is in user's district
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          error: true,
          message: "School not found",
        });
      }

      // Verify school is in user's district
      if (school.districtId !== req.user.districtId) {
        return res.status(403).json({
          error: true,
          message: "Cannot create course for school in another district",
        });
      }

      // Verify teacher is assigned to this school
      const userSchoolId = req.user.schoolId;
      if (userSchoolId && userSchoolId.toString() !== schoolId.toString()) {
        return res.status(403).json({
          error: true,
          message: "Cannot create course for school not assigned to you",
          assignedSchool: userSchoolId,
        });
      }

      // Auto-set districtId based on school
      req.body.districtId = school.districtId;
    }

    // For district admins, they can create courses for any school in their district
    if (req.user.role === ROLES.DISTRICT_ADMIN) {
      if (schoolId) {
        const school = await School.findById(schoolId);
        if (!school) {
          return res.status(404).json({
            error: true,
            message: "School not found",
          });
        }

        if (school.districtId !== req.user.districtId) {
          return res.status(403).json({
            error: true,
            message: "Cannot create course for school outside your district",
          });
        }

        req.body.districtId = school.districtId;
      } else {
        // If no school specified, use user's district
        req.body.districtId = req.user.districtId;
      }
    }

    next();
  } catch (error) {
    console.error("Error in enforceCourseSchoolCreation middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Course school creation enforcement failed",
    });
  }
};

/**
 * Middleware: Add school filter to query
 * Automatically filters MongoDB queries by user's school access
 * Use this for list endpoints
 */
export const addSchoolFilter = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    // Super admin sees all schools
    if (req.user.role === ROLES.SUPER_ADMIN) {
      req.schoolFilter = {};
      return next();
    }

    // Students: only their own school
    if (req.user.role === ROLES.STUDENT || req.user.role === ROLES.TEACHER_AS_STUDENT) {
      const userSchoolId = req.user.schoolId;
      if (userSchoolId) {
        req.schoolFilter = { schoolId: userSchoolId };
      } else {
        req.schoolFilter = { schoolId: null }; // No access if no school assigned
      }
      return next();
    }

    // District admins: all schools in their district (combined with district filter)
    if (req.user.role === ROLES.DISTRICT_ADMIN) {
      req.schoolFilter = {};
      return next();
    }

    // Teachers: their assigned schools
    if (req.user.role === ROLES.TEACHER || req.user.role === ROLES.INSTRUCTOR) {
      const userSchoolId = req.user.schoolId;
      if (userSchoolId) {
        req.schoolFilter = { schoolId: userSchoolId };
      } else {
        req.schoolFilter = { schoolId: null }; // No access if no schools assigned
      }
      return next();
    }

    // Default: no school filter (for other roles)
    req.schoolFilter = {};
    next();
  } catch (error) {
    console.error("Error in addSchoolFilter middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to add school filter",
    });
  }
};

export default {
  verifyDistrictAccess,
  verifySchoolAccess,
  addDistrictFilter,
  enforceDistrictCreation,
  restrictToOwnDistrict,
  buildDistrictQuery,
  canAccessDistrict,
  canAccessSchool,
  restrictToOwnSchool,
  preventCrossDistrictAccess,
  enforceCourseSchoolCreation,
  addSchoolFilter,
};
