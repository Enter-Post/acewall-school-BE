/**
 * RBAC Middleware
 * Permission and role-based access control middleware
 */

import { ROLES, isAdminRole, isTeacherRole, hasRoleLevel } from "../modules/rbac/roles.js";
import * as PERMISSIONS from "../modules/rbac/permissions.js";

/**
 * Calculate permissions based on user role
 * This centralizes permission logic and makes it easy to modify
 * @param {string} role - User role
 * @returns {string[]} Array of permission strings
 */
export const getUserPermissions = (role) => {
  const permissions = [];

  switch (role) {
    case ROLES.SUPER_ADMIN:
      // Super admin has ALL permissions
      return [...PERMISSIONS.ALL_PERMISSIONS];

    case ROLES.ADMIN:
      // Admin has all permissions except district management (which is for district_admin)
      permissions.push(
        ...PERMISSIONS.PERMISSION_CATEGORIES.COURSE,
        ...PERMISSIONS.PERMISSION_CATEGORIES.ASSESSMENT,
        ...PERMISSIONS.PERMISSION_CATEGORIES.USER,
        ...PERMISSIONS.PERMISSION_CATEGORIES.ADMIN,
        ...PERMISSIONS.PERMISSION_CATEGORIES.COMMUNICATION,
        ...PERMISSIONS.PERMISSION_CATEGORIES.ATTENDANCE,
        ...PERMISSIONS.PERMISSION_CATEGORIES.MEETINGS,
        PERMISSIONS.SCHOOL_READ,
        PERMISSIONS.DISTRICT_VIEW
      );
      break;

    case ROLES.DISTRICT_ADMIN:
      // District admin manages district/schools and views data
      permissions.push(
        ...PERMISSIONS.PERMISSION_CATEGORIES.DISTRICT,
        PERMISSIONS.ADMIN_ACCESS,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.GRADEBOOK_VIEW,
        PERMISSIONS.USER_READ,
        PERMISSIONS.ENROLLMENT_READ,
        PERMISSIONS.SCHOOL_READ,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.CHAPTER_READ,
        PERMISSIONS.ASSESSMENT_READ,
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW
      );
      break;

    case ROLES.TEACHER:
    case ROLES.INSTRUCTOR:
      // Teachers manage their courses, assessments, and grade
      permissions.push(
        PERMISSIONS.COURSE_CREATE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.COURSE_UPDATE,
        PERMISSIONS.COURSE_PUBLISH,
        PERMISSIONS.COURSE_ARCHIVE,
        PERMISSIONS.LESSON_CREATE,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.LESSON_UPDATE,
        PERMISSIONS.LESSON_DELETE,
        PERMISSIONS.CHAPTER_CREATE,
        PERMISSIONS.CHAPTER_READ,
        PERMISSIONS.CHAPTER_UPDATE,
        PERMISSIONS.CHAPTER_DELETE,
        PERMISSIONS.ASSESSMENT_CREATE,
        PERMISSIONS.ASSESSMENT_READ,
        PERMISSIONS.ASSESSMENT_UPDATE,
        PERMISSIONS.ASSESSMENT_DELETE,
        PERMISSIONS.ASSESSMENT_GRADE,
        PERMISSIONS.ASSESSMENT_VIEW_ALL,
        PERMISSIONS.GRADEBOOK_VIEW,
        PERMISSIONS.GRADEBOOK_EDIT,
        PERMISSIONS.GRADE_ASSIGN,
        PERMISSIONS.USER_READ,
        PERMISSIONS.ENROLLMENT_CREATE,
        PERMISSIONS.ENROLLMENT_READ,
        PERMISSIONS.ENROLLMENT_UPDATE,
        PERMISSIONS.ANNOUNCEMENT_CREATE,
        PERMISSIONS.ANNOUNCEMENT_MANAGE,
        PERMISSIONS.DISCUSSION_CREATE,
        PERMISSIONS.DISCUSSION_READ,
        PERMISSIONS.DISCUSSION_COMMENT,
        PERMISSIONS.DISCUSSION_MODERATE,
        PERMISSIONS.MESSAGE_SEND,
        PERMISSIONS.COMMENT_MODERATE,
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_MANAGE,
        PERMISSIONS.ATTENDANCE_MARK,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.SCHEDULE_MANAGE,
        PERMISSIONS.MEETING_CREATE,
        PERMISSIONS.MEETING_JOIN,
        PERMISSIONS.MEETING_MANAGE,
        PERMISSIONS.SCHOOL_READ
      );
      break;

    case ROLES.STUDENT:
    case ROLES.TEACHER_AS_STUDENT:
      // Students can read content and take assessments
      permissions.push(
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.LESSON_READ,
        PERMISSIONS.CHAPTER_READ,
        PERMISSIONS.ASSESSMENT_READ,
        PERMISSIONS.ASSESSMENT_TAKE,
        PERMISSIONS.GRADEBOOK_VIEW,
        PERMISSIONS.ENROLLMENT_READ,
        PERMISSIONS.DISCUSSION_READ,
        PERMISSIONS.DISCUSSION_COMMENT,
        PERMISSIONS.MESSAGE_SEND,
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.MEETING_JOIN
      );
      break;

    case ROLES.PARENT:
      // Parents have limited view access
      permissions.push(
        PERMISSIONS.PARENT_VIEW_PROGRESS,
        PERMISSIONS.PARENT_VIEW_GRADES,
        PERMISSIONS.PARENT_VIEW_ATTENDANCE,
        PERMISSIONS.PARENT_MESSAGE_TEACHER,
        PERMISSIONS.PARENT_VIEW_SCHEDULE,
        PERMISSIONS.COURSE_READ,
        PERMISSIONS.SCHEDULE_VIEW
      );
      break;

    default:
      // Unknown role gets minimal read access
      permissions.push(PERMISSIONS.COURSE_READ);
  }

  return [...new Set(permissions)]; // Remove duplicates
};

/**
 * Middleware factory: Require specific permission(s)
 * Usage: router.post('/create', isUser, requirePermission(PERMISSIONS.COURSE_CREATE), createCourse)
 * @param {...string} permissions - Required permissions
 * @returns {Function} Express middleware
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      // Get user's permissions from JWT or calculate them
      const userPermissions = req.user.permissions || getUserPermissions(req.user.role);

      // Check if user has ALL required permissions
      const hasAllPermissions = permissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          error: true,
          message: "Insufficient permissions",
          required: permissions,
          userRole: req.user.role,
        });
      }

      // Attach hasPermission helper to req.user for convenience
      req.user.hasPermission = (perm) => userPermissions.includes(perm);
      req.user.permissions = userPermissions;

      next();
    } catch (error) {
      console.error("Error in requirePermission middleware:", error);
      return res.status(500).json({
        error: true,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Middleware factory: Require specific role(s)
 * Usage: router.get('/admin-only', isUser, requireRole(ROLES.ADMIN), handler)
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: true,
          message: "Access denied: insufficient role",
          requiredRoles: roles,
          userRole,
        });
      }

      next();
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      return res.status(500).json({
        error: true,
        message: "Role check failed",
      });
    }
  };
};

/**
 * Middleware: Require admin role (any admin level)
 * Allows super_admin, admin, and district_admin
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: "Admin access required",
        userRole: req.user.role,
      });
    }

    next();
  } catch (error) {
    console.error("Error in requireAdmin middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Admin check failed",
    });
  }
};

/**
 * Middleware: Require teacher role (teacher or instructor)
 */
export const requireTeacher = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    if (!isTeacherRole(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: "Teacher access required",
        userRole: req.user.role,
      });
    }

    next();
  } catch (error) {
    console.error("Error in requireTeacher middleware:", error);
    return res.status(500).json({
      error: true,
      message: "Teacher check failed",
    });
  };
};

/**
 * Backward-compatible permission check
 * Falls back to role-based check if permissions aren't in JWT
 * Use this during gradual migration
 * @param {string[]} permissions - Required permissions
 * @param {string} fallbackRole - Fallback role that can access (for backward compat)
 * @returns {Function} Express middleware
 */
export const backwardCompatiblePermission = (permissions, fallbackRole = null) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: true,
          message: "Authentication required",
        });
      }

      // If user has permissions in JWT, use permission-based check
      if (req.user.permissions && req.user.permissions.length > 0) {
        const requiredPerms = Array.isArray(permissions) ? permissions : [permissions];
        const hasAllPermissions = requiredPerms.every((perm) =>
          req.user.permissions.includes(perm)
        );

        if (hasAllPermissions) {
          return next();
        }
      }

      // Fallback: check role (for backward compatibility during migration)
      if (fallbackRole) {
        if (req.user.role === fallbackRole || hasRoleLevel(req.user.role, fallbackRole)) {
          // Calculate and attach permissions for future checks
          req.user.permissions = getUserPermissions(req.user.role);
          req.user.hasPermission = (perm) => req.user.permissions.includes(perm);
          return next();
        }
      }

      // Also allow if user has the required permission (calculated from role)
      const userPerms = getUserPermissions(req.user.role);
      const requiredPerms = Array.isArray(permissions) ? permissions : [permissions];
      const hasAllPermissions = requiredPerms.every((perm) => userPerms.includes(perm));

      if (hasAllPermissions) {
        req.user.permissions = userPerms;
        req.user.hasPermission = (perm) => userPerms.includes(perm);
        return next();
      }

      return res.status(403).json({
        error: true,
        message: "Insufficient permissions",
        required: permissions,
        userRole: req.user.role,
      });
    } catch (error) {
      console.error("Error in backwardCompatiblePermission middleware:", error);
      return res.status(500).json({
        error: true,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Helper to check if user can access a specific resource
 * Combines permission check with ownership check
 * @param {Object} req - Express request object
 * @param {string} permission - Required permission
 * @param {string} resourceOwnerId - Owner ID of the resource
 * @returns {boolean}
 */
export const canAccessResource = (req, permission, resourceOwnerId = null) => {
  if (!req.user) return false;

  const userPermissions = req.user.permissions || getUserPermissions(req.user.role);

  // Has explicit permission
  if (userPermissions.includes(permission)) return true;

  // Is admin (admins can access everything in their scope)
  if (isAdminRole(req.user.role)) return true;

  // Is owner of resource
  if (resourceOwnerId && req.user._id?.toString() === resourceOwnerId.toString()) return true;

  return false;
};

export default {
  getUserPermissions,
  requirePermission,
  requireRole,
  requireAdmin,
  requireTeacher,
  backwardCompatiblePermission,
  canAccessResource,
};
