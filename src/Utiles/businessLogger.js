import {
  logLogin,
  logLogout,
  logEnrollment,
  logAssignmentSubmit,
  logQuizSubmit,
  logFileUpload,
  logAction,
} from "../services/activityLog.service.js";

/**
 * Business Logic Logger
 * Helper utilities to log critical LMS business events
 * Import these functions into your controllers to add logging
 */

/**
 * Get request metadata (IP and user agent)
 */
const getRequestMeta = (req) => ({
  ipAddress: getClientIp(req),
  userAgent: req.headers["user-agent"],
});

/**
 * Extract client IP from request
 * Handles proxies and various header formats
 */
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];

  // Helper to check if IP is localhost
  const isLocalhost = (ip) => {
    if (!ip) return true;
    return ip === "::1" ||
           ip === "127.0.0.1" ||
           ip === "localhost" ||
           ip.startsWith("::ffff:127.0.0.1") ||
           ip.startsWith("127.") ||
           ip === "0:0:0:0:0:0:0:1";
  };

  // Try X-Forwarded-For first (common proxy header)
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
    // We want the first non-localhost IP (the original client)
    const ips = forwarded.split(",").map(ip => ip.trim());
    for (const ip of ips) {
      if (!isLocalhost(ip)) {
        return ip;
      }
    }
    // If all are localhost, return the first one
    return ips[0];
  }

  // Try X-Real-IP (NGINX, etc.)
  if (realIp && !isLocalhost(realIp)) {
    return realIp;
  }

  // Get IP from request
  const reqIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;

  // If localhost, check if there's a forwarded IP in other headers
  if (isLocalhost(reqIp)) {
    // Try additional headers
    const cfIp = req.headers["cf-connecting-ip"]; // Cloudflare
    const trueClientIp = req.headers["true-client-ip"]; // Akamai, etc.

    if (cfIp && !isLocalhost(cfIp)) return cfIp;
    if (trueClientIp && !isLocalhost(trueClientIp)) return trueClientIp;
  }

  return reqIp || "unknown";
};

/**
 * Log user login
 * Call this in your login controller after successful authentication
 */
export const trackLogin = (userId, req) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logLogin({
    userId,
    ipAddress,
    userAgent,
    metadata: {
      loginMethod: req.body?.loginMethod || "email",
      portal: req.hostname?.startsWith("admin.") ? "admin" : "client",
    },
  });
};

/**
 * Log user logout
 * Call this in your logout controller
 */
export const trackLogout = (userId, req) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logLogout({
    userId,
    ipAddress,
    userAgent,
  });
};

/**
 * Log course enrollment
 * Call this after successful enrollment
 */
export const trackEnrollment = (userId, courseId, courseTitle, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logEnrollment({
    userId,
    courseId,
    metadata: {
      ...metadata,
      courseTitle,
      enrolledVia: req.body?.enrollmentMethod || "direct",
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log assignment submission
 * Call this after successful assignment submission
 */
export const trackAssignmentSubmission = (userId, assignmentId, courseId, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logAssignmentSubmit({
    userId,
    assignmentId,
    courseId,
    metadata: {
      ...metadata,
      submittedFiles: metadata.fileCount || 0,
      submittedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log quiz submission
 * Call this after successful quiz submission
 */
export const trackQuizSubmission = (userId, quizId, courseId, score, totalPoints, req) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logQuizSubmit({
    userId,
    quizId,
    courseId,
    metadata: {
      score,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
      submittedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log file upload
 * Call this after successful file upload
 */
export const trackFileUpload = (userId, fileName, fileType, fileSize, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logFileUpload({
    userId,
    fileName,
    fileType,
    metadata: {
      ...metadata,
      fileSize,
      uploadedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log course purchase
 * Call this after successful purchase/transaction
 */
export const trackPurchase = (userId, courseId, amount, currency, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logAction({
    event: "course_purchased",
    userId,
    metadata: {
      ...metadata,
      courseId,
      amount,
      currency,
      purchasedAt: new Date(),
      paymentMethod: metadata.paymentMethod || "unknown",
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log message sent
 * Call this when a user sends a message
 */
export const trackMessageSent = (senderId, receiverId, messageType, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logAction({
    event: "message_sent",
    userId: senderId,
    metadata: {
      ...metadata,
      receiverId,
      messageType, // 'text', 'file', 'image', etc.
      sentAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log discussion activity
 * Call this when user creates/updates a discussion
 */
export const trackDiscussionActivity = (userId, action, discussionId, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  const eventNames = {
    create: "discussion_created",
    update: "discussion_updated",
    delete: "discussion_deleted",
    comment: "discussion_commented",
    reply: "discussion_replied",
  };

  logAction({
    event: eventNames[action] || "discussion_activity",
    userId,
    page: req.originalUrl,
    metadata: {
      ...metadata,
      discussionId,
      action,
      timestamp: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log grade/assessment activity
 * Call this when grades are updated or assessments are graded
 */
export const trackGradingActivity = (teacherId, studentId, assessmentId, action, score, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  logAction({
    event: "grading_activity",
    userId: teacherId,
    metadata: {
      ...metadata,
      studentId,
      assessmentId,
      action, // 'grade_assigned', 'grade_updated', 'feedback_added'
      score,
      gradedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log announcement activity
 * Call this when announcements are created/updated
 */
export const trackAnnouncementActivity = (userId, action, announcementId, courseId, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  const eventNames = {
    create: "announcement_created",
    update: "announcement_updated",
    delete: "announcement_deleted",
    publish: "announcement_published",
  };

  logAction({
    event: eventNames[action] || "announcement_activity",
    userId,
    metadata: {
      ...metadata,
      announcementId,
      courseId,
      action,
      timestamp: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Log course content creation/update
 * Call this when teachers create or update course content
 */
export const trackCourseContentActivity = (teacherId, action, contentType, courseId, contentId, req, metadata = {}) => {
  const { ipAddress, userAgent } = getRequestMeta(req);

  const eventNames = {
    create: `${contentType}_created`,
    update: `${contentType}_updated`,
    delete: `${contentType}_deleted`,
    publish: `${contentType}_published`,
  };

  logAction({
    event: eventNames[action] || "content_activity",
    userId: teacherId,
    metadata: {
      ...metadata,
      contentType, // 'chapter', 'lesson', 'assessment', 'page'
      contentId,
      courseId,
      action,
      timestamp: new Date(),
      ipAddress,
      userAgent,
    },
  });
};

/**
 * Generic action tracker
 * Use this for custom actions not covered above
 */
export const trackAction = (event, userId, metadata = {}, req = null) => {
  const extraMeta = req ? getRequestMeta(req) : {};

  logAction({
    event,
    userId,
    page: req?.originalUrl,
    metadata: {
      ...metadata,
      ...extraMeta,
      timestamp: new Date(),
    },
  });
};

export default {
  trackLogin,
  trackLogout,
  trackEnrollment,
  trackAssignmentSubmission,
  trackQuizSubmission,
  trackFileUpload,
  trackPurchase,
  trackMessageSent,
  trackDiscussionActivity,
  trackGradingActivity,
  trackAnnouncementActivity,
  trackCourseContentActivity,
  trackAction,
};
