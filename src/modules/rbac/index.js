/**
 * RBAC Module - Barrel Export
 * Centralized Role-Based Access Control exports
 */

// Roles
export {
  ROLES,
  ROLE_HIERARCHY,
  hasRoleLevel,
  isAdminRole,
  isTeacherRole,
  getAllRoles,
} from "./roles.js";

// Permissions
export * from "./permissions.js";

// RBAC Middleware (re-exported for convenience)
export {
  getUserPermissions,
  requirePermission,
  requireRole,
  requireAdmin,
  requireTeacher,
  backwardCompatiblePermission,
  canAccessResource,
} from "../../middlewares/rbac.middleware.js";

// District Middleware (re-exported for convenience)
export {
  verifyDistrictAccess,
  verifySchoolAccess,
  addDistrictFilter,
  enforceDistrictCreation,
  restrictToOwnDistrict,
  buildDistrictQuery,
  canAccessDistrict,
  canAccessSchool,
} from "../../middlewares/district.middleware.js";

// Default export combining all
export { default } from "./roles.js";
