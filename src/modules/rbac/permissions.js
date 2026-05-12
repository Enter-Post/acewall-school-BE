/**
 * Permission Constants for RBAC
 * 60+ granular permissions organized by category
 */

// ==================== COURSE & CONTENT (12) ====================
export const COURSE_CREATE = 'course:create';
export const COURSE_READ = 'course:read';
export const COURSE_UPDATE = 'course:update';
export const COURSE_DELETE = 'course:delete';
export const COURSE_PUBLISH = 'course:publish';
export const COURSE_ARCHIVE = 'course:archive';

export const LESSON_CREATE = 'lesson:create';
export const LESSON_READ = 'lesson:read';
export const LESSON_UPDATE = 'lesson:update';
export const LESSON_DELETE = 'lesson:delete';

export const CHAPTER_CREATE = 'chapter:create';
export const CHAPTER_READ = 'chapter:read';
export const CHAPTER_UPDATE = 'chapter:update';
export const CHAPTER_DELETE = 'chapter:delete';

// ==================== ASSESSMENT & GRADING (10) ====================
export const ASSESSMENT_CREATE = 'assessment:create';
export const ASSESSMENT_READ = 'assessment:read';
export const ASSESSMENT_UPDATE = 'assessment:update';
export const ASSESSMENT_DELETE = 'assessment:delete';
export const ASSESSMENT_TAKE = 'assessment:take';
export const ASSESSMENT_GRADE = 'assessment:grade';
export const ASSESSMENT_VIEW_ALL = 'assessment:view_all';

export const GRADEBOOK_VIEW = 'gradebook:view';
export const GRADEBOOK_EDIT = 'gradebook:edit';
export const GRADE_ASSIGN = 'grade:assign';

// ==================== USER MANAGEMENT (8) ====================
export const USER_CREATE = 'user:create';
export const USER_READ = 'user:read';
export const USER_UPDATE = 'user:update';
export const USER_DELETE = 'user:delete';

export const ENROLLMENT_CREATE = 'enrollment:create';
export const ENROLLMENT_READ = 'enrollment:read';
export const ENROLLMENT_UPDATE = 'enrollment:update';
export const ENROLLMENT_DELETE = 'enrollment:delete';

// ==================== DISTRICT & SCHOOL (BCPS) (10) ====================
export const DISTRICT_MANAGE = 'district:manage';
export const DISTRICT_VIEW = 'district:view';

export const SCHOOL_CREATE = 'school:create';
export const SCHOOL_READ = 'school:read';
export const SCHOOL_UPDATE = 'school:update';
export const SCHOOL_DELETE = 'school:delete';
export const SCHOOL_MANAGE = 'school:manage';

export const ROSTER_SYNC = 'roster:sync';
export const ROSTER_CLEVER_SYNC = 'roster:clever_sync';
export const ROSTER_ONEROSTER_SYNC = 'roster:oneroster_sync';

// ==================== ADMIN & SYSTEM (8) ====================
export const ADMIN_ACCESS = 'admin:access';
export const SYSTEM_SETTINGS = 'system:settings';
export const ANALYTICS_VIEW = 'analytics:view';
export const REPORT_VIEW = 'report:view';

export const ANNOUNCEMENT_CREATE = 'announcement:create';
export const ANNOUNCEMENT_MANAGE = 'announcement:manage';

export const PAGE_CREATE = 'page:create';
export const PAGE_MANAGE = 'page:manage';

// ==================== PARENT PORTAL (5) ====================
export const PARENT_VIEW_PROGRESS = 'parent:view_progress';
export const PARENT_VIEW_GRADES = 'parent:view_grades';
export const PARENT_VIEW_ATTENDANCE = 'parent:view_attendance';
export const PARENT_MESSAGE_TEACHER = 'parent:message_teacher';
export const PARENT_VIEW_SCHEDULE = 'parent:view_schedule';

// ==================== DISCUSSION & COMMUNICATION (5) ====================
export const DISCUSSION_CREATE = 'discussion:create';
export const DISCUSSION_READ = 'discussion:read';
export const DISCUSSION_COMMENT = 'discussion:comment';
export const DISCUSSION_MODERATE = 'discussion:moderate';

export const MESSAGE_SEND = 'message:send';

// ==================== CONTENT MODERATION (4) ====================
export const COMMENT_MODERATE = 'comment:moderate';
export const POST_CREATE = 'post:create';
export const POST_MANAGE = 'post:manage';

// ==================== ATTENDANCE & SCHEDULING (4) ====================
export const ATTENDANCE_MARK = 'attendance:mark';
export const ATTENDANCE_VIEW = 'attendance:view';
export const SCHEDULE_VIEW = 'schedule:view';
export const SCHEDULE_MANAGE = 'schedule:manage';

// ==================== ZOOM & MEETINGS (4) ====================
export const MEETING_CREATE = 'meeting:create';
export const MEETING_JOIN = 'meeting:join';
export const MEETING_MANAGE = 'meeting:manage';

// ==================== PERMISSION GROUPS ====================

/**
 * All permissions as array for validation
 */
export const ALL_PERMISSIONS = [
  // Course & Content
  COURSE_CREATE, COURSE_READ, COURSE_UPDATE, COURSE_DELETE, COURSE_PUBLISH, COURSE_ARCHIVE,
  LESSON_CREATE, LESSON_READ, LESSON_UPDATE, LESSON_DELETE,
  CHAPTER_CREATE, CHAPTER_READ, CHAPTER_UPDATE, CHAPTER_DELETE,
  // Assessment & Grading
  ASSESSMENT_CREATE, ASSESSMENT_READ, ASSESSMENT_UPDATE, ASSESSMENT_DELETE,
  ASSESSMENT_TAKE, ASSESSMENT_GRADE, ASSESSMENT_VIEW_ALL,
  GRADEBOOK_VIEW, GRADEBOOK_EDIT, GRADE_ASSIGN,
  // User Management
  USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE,
  ENROLLMENT_CREATE, ENROLLMENT_READ, ENROLLMENT_UPDATE, ENROLLMENT_DELETE,
  // District & School
  DISTRICT_MANAGE, DISTRICT_VIEW,
  SCHOOL_CREATE, SCHOOL_READ, SCHOOL_UPDATE, SCHOOL_DELETE, SCHOOL_MANAGE,
  ROSTER_SYNC, ROSTER_CLEVER_SYNC, ROSTER_ONEROSTER_SYNC,
  // Admin & System
  ADMIN_ACCESS, SYSTEM_SETTINGS, ANALYTICS_VIEW, REPORT_VIEW,
  ANNOUNCEMENT_CREATE, ANNOUNCEMENT_MANAGE,
  PAGE_CREATE, PAGE_MANAGE,
  // Parent Portal
  PARENT_VIEW_PROGRESS, PARENT_VIEW_GRADES, PARENT_VIEW_ATTENDANCE,
  PARENT_MESSAGE_TEACHER, PARENT_VIEW_SCHEDULE,
  // Discussion & Communication
  DISCUSSION_CREATE, DISCUSSION_READ, DISCUSSION_COMMENT, DISCUSSION_MODERATE,
  MESSAGE_SEND,
  // Content Moderation
  COMMENT_MODERATE, POST_CREATE, POST_MANAGE,
  // Attendance & Scheduling
  ATTENDANCE_MARK, ATTENDANCE_VIEW, SCHEDULE_VIEW, SCHEDULE_MANAGE,
  // Zoom & Meetings
  MEETING_CREATE, MEETING_JOIN, MEETING_MANAGE,
];

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  COURSE: [
    COURSE_CREATE, COURSE_READ, COURSE_UPDATE, COURSE_DELETE, COURSE_PUBLISH, COURSE_ARCHIVE,
    LESSON_CREATE, LESSON_READ, LESSON_UPDATE, LESSON_DELETE,
    CHAPTER_CREATE, CHAPTER_READ, CHAPTER_UPDATE, CHAPTER_DELETE,
  ],
  ASSESSMENT: [
    ASSESSMENT_CREATE, ASSESSMENT_READ, ASSESSMENT_UPDATE, ASSESSMENT_DELETE,
    ASSESSMENT_TAKE, ASSESSMENT_GRADE, ASSESSMENT_VIEW_ALL,
    GRADEBOOK_VIEW, GRADEBOOK_EDIT, GRADE_ASSIGN,
  ],
  USER: [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE,
    ENROLLMENT_CREATE, ENROLLMENT_READ, ENROLLMENT_UPDATE, ENROLLMENT_DELETE,
  ],
  DISTRICT: [
    DISTRICT_MANAGE, DISTRICT_VIEW,
    SCHOOL_CREATE, SCHOOL_READ, SCHOOL_UPDATE, SCHOOL_DELETE, SCHOOL_MANAGE,
    ROSTER_SYNC, ROSTER_CLEVER_SYNC, ROSTER_ONEROSTER_SYNC,
  ],
  ADMIN: [
    ADMIN_ACCESS, SYSTEM_SETTINGS, ANALYTICS_VIEW, REPORT_VIEW,
    ANNOUNCEMENT_CREATE, ANNOUNCEMENT_MANAGE,
    PAGE_CREATE, PAGE_MANAGE,
  ],
  PARENT: [
    PARENT_VIEW_PROGRESS, PARENT_VIEW_GRADES, PARENT_VIEW_ATTENDANCE,
    PARENT_MESSAGE_TEACHER, PARENT_VIEW_SCHEDULE,
  ],
  COMMUNICATION: [
    DISCUSSION_CREATE, DISCUSSION_READ, DISCUSSION_COMMENT, DISCUSSION_MODERATE,
    MESSAGE_SEND, COMMENT_MODERATE, POST_CREATE, POST_MANAGE,
  ],
  ATTENDANCE: [
    ATTENDANCE_MARK, ATTENDANCE_VIEW, SCHEDULE_VIEW, SCHEDULE_MANAGE,
  ],
  MEETINGS: [
    MEETING_CREATE, MEETING_JOIN, MEETING_MANAGE,
  ],
};

/**
 * Validate if a permission string is valid
 * @param {string} permission
 * @returns {boolean}
 */
export const isValidPermission = (permission) => {
  return ALL_PERMISSIONS.includes(permission);
};

/**
 * Get permissions by category
 * @param {string} category
 * @returns {string[]}
 */
export const getPermissionsByCategory = (category) => {
  return PERMISSION_CATEGORIES[category.toUpperCase()] || [];
};

export default {
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  isValidPermission,
  getPermissionsByCategory,
};
