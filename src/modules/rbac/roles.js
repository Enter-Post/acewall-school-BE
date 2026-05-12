/**
 * Role Constants for RBAC
 * Defines all available user roles in the system
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DISTRICT_ADMIN: 'district_admin',
  TEACHER: 'teacher',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER_AS_STUDENT: 'teacherAsStudent',
};

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 90,
  [ROLES.DISTRICT_ADMIN]: 80,
  [ROLES.TEACHER]: 70,
  [ROLES.INSTRUCTOR]: 70,
  [ROLES.TEACHER_AS_STUDENT]: 60,
  [ROLES.STUDENT]: 50,
  [ROLES.PARENT]: 40,
};

/**
 * Check if userRole has higher or equal privilege than requiredRole
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The required role level
 * @returns {boolean}
 */
export const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Check if a role is an admin role
 * @param {string} role
 * @returns {boolean}
 */
export const isAdminRole = (role) => {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DISTRICT_ADMIN].includes(role);
};

/**
 * Check if a role is a teacher role
 * @param {string} role
 * @returns {boolean}
 */
export const isTeacherRole = (role) => {
  return [ROLES.TEACHER, ROLES.INSTRUCTOR].includes(role);
};

/**
 * Get all available roles as array
 * @returns {string[]}
 */
export const getAllRoles = () => Object.values(ROLES);

export default ROLES;
