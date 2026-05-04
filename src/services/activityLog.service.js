import ActivityLog from "../Models/activityLog.model.js";
import { UAParser } from "ua-parser-js";

/**
 * Activity Logging Service
 * Handles all logging operations with async processing
 */

/**
 * Parse user agent string into clean analytics data
 * @param {string} userAgent - Raw user agent string
 * @returns {Object} - Parsed browser, browserVersion, os, deviceType
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return {};

  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser: result.browser.name || "Unknown",
      browserVersion: result.browser.version?.split(".")[0] || "Unknown",
      os: result.os.name ? `${result.os.name} ${result.os.version || ""}`.trim() : "Unknown",
      deviceType: result.device.type || "Desktop",
    };
  } catch (error) {
    console.error("[ActivityLogService] Error parsing user agent:", error.message);
    return {};
  }
};

// In-memory queue for batch processing (optional optimization)
const logQueue = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 seconds

/**
 * Create a new activity log entry
 * @param {Object} logData - The log data to save
 * @returns {Promise<Object>} - The created log entry
 */
export const createLog = async (logData) => {
  try {
    // Parse user agent if provided
    const deviceInfo = logData.userAgent ? parseUserAgent(logData.userAgent) : {};

    const log = new ActivityLog({
      ...logData,
      ...deviceInfo,
      timestamp: logData.timestamp || new Date(),
    });

    // Fire and forget - don't await to avoid blocking
    const savedLog = await log.save();
    return savedLog;
  } catch (error) {
    console.error("[ActivityLogService] Error creating log:", error);
    // Don't throw - logging should never break the application
    return null;
  }
};

/**
 * Log an API call
 * @param {Object} params
 * @param {string} params.method - HTTP method
 * @param {string} params.route - API route
 * @param {string} params.userId - User ID
 * @param {number} params.statusCode - Response status code
 * @param {number} params.responseTime - Response time in ms
 * @param {Object} params.metadata - Additional metadata
 */
export const logApiCall = async ({
  method,
  route,
  userId,
  statusCode,
  responseTime,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  return createLog({
    type: "api_call",
    event: `${method} ${route}`,
    userId,
    statusCode,
    responseTime,
    ipAddress,
    userAgent,
    metadata,
    level: statusCode >= 400 ? "error" : "info",
  });
};

/**
 * Log a user action
 * @param {Object} params
 * @param {string} params.event - Event name
 * @param {string} params.userId - User ID
 * @param {string} params.page - Current page/URL
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.level - Log level (info, warning, error)
 */
export const logAction = async ({
  event,
  userId,
  page,
  ipAddress,
  userAgent,
  metadata = {},
  level = "info",
}) => {
  return createLog({
    type: "action",
    event,
    userId,
    page,
    ipAddress,
    userAgent,
    metadata,
    level,
  });
};

/**
 * Log a page view
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.page - Page URL/path
 * @param {Object} params.metadata - Additional metadata
 */
export const logPageView = async ({
  userId,
  page,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  return createLog({
    type: "page_view",
    event: "page_view",
    userId,
    page,
    ipAddress,
    userAgent,
    metadata,
    level: "info",
  });
};

/**
 * Log a click event
 * @param {Object} params
 * @param {string} params.event - Click event name (from data-track)
 * @param {string} params.userId - User ID
 * @param {string} params.page - Current page
 * @param {Object} params.metadata - Additional metadata (element info, etc.)
 */
export const logClick = async ({
  event,
  userId,
  page,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  return createLog({
    type: "click",
    event,
    userId,
    page,
    ipAddress,
    userAgent,
    metadata,
    level: "info",
  });
};

/**
 * Log a form submission
 * @param {Object} params
 * @param {string} params.event - Form event name (e.g., "login_submit")
 * @param {string} params.userId - User ID
 * @param {string} params.page - Current page
 * @param {Object} params.metadata - Form data (sanitized)
 */
export const logFormSubmit = async ({
  event,
  userId,
  page,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  // Sanitize metadata to avoid logging sensitive data
  const sanitizedMetadata = sanitizeMetadata(metadata);

  return createLog({
    type: "form_submit",
    event,
    userId,
    page,
    ipAddress,
    userAgent,
    metadata: sanitizedMetadata,
    level: "info",
  });
};

/**
 * Log user login
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 * @param {Object} params.metadata - Additional metadata
 */
export const logLogin = async ({ userId, ipAddress, userAgent, metadata = {} }) => {
  return createLog({
    type: "login",
    event: "user_login",
    userId,
    ipAddress,
    userAgent,
    metadata,
    level: "info",
  });
};

/**
 * Log user logout
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 */
export const logLogout = async ({ userId, ipAddress, userAgent }) => {
  return createLog({
    type: "logout",
    event: "user_logout",
    userId,
    ipAddress,
    userAgent,
    level: "info",
  });
};

/**
 * Log enrollment
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.courseId - Course ID
 * @param {Object} params.metadata - Additional metadata
 */
export const logEnrollment = async ({ userId, courseId, metadata = {} }) => {
  return createLog({
    type: "enrollment",
    event: "course_enrolled",
    userId,
    metadata: {
      ...metadata,
      courseId,
    },
    level: "info",
  });
};

/**
 * Log assignment submission
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.assignmentId - Assignment ID
 * @param {string} params.courseId - Course ID
 * @param {Object} params.metadata - Additional metadata
 */
export const logAssignmentSubmit = async ({
  userId,
  assignmentId,
  courseId,
  metadata = {},
}) => {
  return createLog({
    type: "assignment_submit",
    event: "assignment_submitted",
    userId,
    metadata: {
      ...metadata,
      assignmentId,
      courseId,
    },
    level: "info",
  });
};

/**
 * Log quiz submission
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.quizId - Quiz ID
 * @param {string} params.courseId - Course ID
 * @param {Object} params.metadata - Additional metadata (score, etc.)
 */
export const logQuizSubmit = async ({ userId, quizId, courseId, metadata = {} }) => {
  return createLog({
    type: "quiz_submit",
    event: "quiz_submitted",
    userId,
    metadata: {
      ...metadata,
      quizId,
      courseId,
    },
    level: "info",
  });
};

/**
 * Log file upload
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.fileName - File name
 * @param {string} params.fileType - File type
 * @param {Object} params.metadata - Additional metadata
 */
export const logFileUpload = async ({ userId, fileName, fileType, metadata = {} }) => {
  return createLog({
    type: "file_upload",
    event: "file_uploaded",
    userId,
    metadata: {
      ...metadata,
      fileName,
      fileType,
    },
    level: "info",
  });
};

/**
 * Log an error
 * @param {Object} params
 * @param {string} params.event - Error event name
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.message - Error message
 * @param {string} params.stack - Error stack trace (dev only)
 * @param {Object} params.metadata - Additional metadata
 */
export const logError = async ({ event, userId, message, stack, metadata = {} }) => {
  const isDev = process.env.NODE_ENV === "development";

  return createLog({
    type: "error",
    event: event || "error_occurred",
    userId,
    metadata: {
      ...metadata,
      message,
      ...(isDev && stack ? { stack } : {}),
    },
    level: "error",
  });
};

/**
 * Get logs with filtering and pagination
 * @param {Object} filters
 * @param {string} filters.userId - Filter by user
 * @param {string} filters.type - Filter by type
 * @param {string} filters.event - Filter by event
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @param {string} filters.level - Filter by level
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 */
export const getLogs = async ({
  userId,
  type,
  event,
  startDate,
  endDate,
  level,
  page = 1,
  limit = 50,
}) => {
  try {
    const query = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (event) query.event = event;
    if (level) query.level = level;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email role")
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("[ActivityLogService] Error fetching logs:", error);
    throw error;
  }
};

/**
 * Get log statistics
 * @param {Object} params
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 */
export const getLogStats = async ({ startDate, endDate } = {}) => {
  try {
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const stats = await ActivityLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  } catch (error) {
    console.error("[ActivityLogService] Error fetching stats:", error);
    throw error;
  }
};

/**
 * Sanitize metadata to remove sensitive fields
 * @param {Object} metadata - Raw metadata
 * @returns {Object} - Sanitized metadata
 */
const sanitizeMetadata = (metadata) => {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "creditCard",
    "ssn",
    "apiKey",
  ];

  const sanitized = { ...metadata };

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Batch process logs (optional optimization for high volume)
 * This can be enabled if you need to batch log writes
 */
export const flushLogQueue = async () => {
  if (logQueue.length === 0) return;

  const logsToProcess = [...logQueue];
  logQueue.length = 0;

  try {
    await ActivityLog.insertMany(logsToProcess, { ordered: false });
  } catch (error) {
    console.error("[ActivityLogService] Error batch inserting logs:", error);
  }
};

// Optional: Set up interval for batch processing
// setInterval(flushLogQueue, BATCH_INTERVAL);

export default {
  createLog,
  logApiCall,
  logAction,
  logPageView,
  logClick,
  logFormSubmit,
  logLogin,
  logLogout,
  logEnrollment,
  logAssignmentSubmit,
  logQuizSubmit,
  logFileUpload,
  logError,
  getLogs,
  getLogStats,
};
