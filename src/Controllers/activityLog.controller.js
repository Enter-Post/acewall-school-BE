import activityLogService from "../services/activityLog.service.js";
import { createLog } from "../services/activityLog.service.js";

/**
 * Activity Log Controller
 * Handles incoming log requests from frontend and admin queries
 */

/**
 * Create a new log entry (from frontend)
 * POST /api/logs
 */
export const createLogEntry = async (req, res) => {
  try {
    const { type, event, page, metadata, timestamp } = req.body;

    // Validate required fields
    if (!type || !event) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields: type and event are required",
      });
    }

    // Get user info from auth middleware
    const userId = req.user?._id || req.user?.id || null;
    const { districtId, schoolId } = req.user

    // Capture request metadata
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    // Create the log entry (fire and forget - don't block response)
    createLog({
      type,
      event,
      userId,
      page: page || req.headers.referer || "unknown",
      metadata: metadata || {},
      ipAddress,
      userAgent,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    }).catch((err) => {
      console.error("[ActivityLogController] Failed to save log:", err.message);
    });

    // Return success immediately (don't wait for DB write)
    res.status(202).json({
      success: true,
      message: "Log received",
    });
  } catch (error) {
    console.error("[ActivityLogController] Error creating log entry:", error);
    // Return 202 anyway - logging should never break the frontend
    res.status(202).json({
      success: true,
      message: "Log received",
    });
  }
};

/**
 * Batch create log entries (for batching frontend logs)
 * POST /api/logs/batch
 */
export const createBatchLogs = async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Missing required field: logs array is required",
      });
    }

    const userId = req.user?._id || req.user?.id || null;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"];

    // Process all logs (fire and forget)
    const logPromises = logs.map((log) =>
      createLog({
        type: log.type,
        event: log.event,
        userId,
        page: log.page || req.headers.referer || "unknown",
        metadata: log.metadata || {},
        ipAddress,
        userAgent,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      }).catch((err) => {
        console.error("[ActivityLogController] Failed to save batch log:", err.message);
      })
    );

    // Don't await - let them process in background
    Promise.all(logPromises);

    res.status(202).json({
      success: true,
      message: `${logs.length} logs received`,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error creating batch logs:", error);
    res.status(202).json({
      success: true,
      message: "Logs received",
    });
  }
};

/**
 * Get logs with filtering (admin endpoint)
 * GET /api/logs
 */
export const getLogs = async (req, res) => {
  try {
    const {
      userId,
      type,
      event,
      startDate,
      endDate,
      level,
      page = 1,
      limit = 50,
    } = req.query;

    const result = await activityLogService.getLogs({
      userId,
      type,
      event,
      startDate,
      endDate,
      level,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error fetching logs:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch logs",
    });
  }
};

/**
 * Get log statistics (admin endpoint)
 * GET /api/logs/stats
 */
export const getLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await activityLogService.getLogStats({
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error fetching stats:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch log statistics",
    });
  }
};

/**
 * Get user activity summary
 * GET /api/logs/user/:userId/summary
 */
export const getUserActivitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const logs = await activityLogService.getLogs({
      userId,
      startDate,
      page: 1,
      limit: 1000,
    });

    // Calculate summary statistics
    const summary = {
      totalActions: logs.logs.length,
      pageViews: logs.logs.filter((l) => l.type === "page_view").length,
      clicks: logs.logs.filter((l) => l.type === "click").length,
      formSubmissions: logs.logs.filter((l) => l.type === "form_submit").length,
      apiCalls: logs.logs.filter((l) => l.type === "api_call").length,
      errors: logs.logs.filter((l) => l.type === "error" || l.level === "error").length,
      uniquePages: [
        ...new Set(logs.logs.filter((l) => l.page).map((l) => l.page)),
      ],
      lastActivity: logs.logs.length > 0 ? logs.logs[0].timestamp : null,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error fetching user summary:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch user activity summary",
    });
  }
};

/**
 * Get current user's own activity
 * GET /api/logs/my-activity
 */
export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: true,
        message: "User not authenticated",
      });
    }

    const { days = 7, page = 1, limit = 50 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const result = await activityLogService.getLogs({
      userId,
      startDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error fetching my activity:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch activity",
    });
  }
};

/**
 * Delete old logs (admin only)
 * DELETE /api/logs/cleanup
 */
export const cleanupOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days, 10));

    // This would require adding a delete method to the service
    // For now, just return success (TTL index handles cleanup automatically)
    res.status(200).json({
      success: true,
      message: `Logs older than ${days} days will be cleaned up by TTL index`,
    });
  } catch (error) {
    console.error("[ActivityLogController] Error cleaning up logs:", error);
    res.status(500).json({
      error: true,
      message: "Failed to cleanup logs",
    });
  }
};

/**
 * Extract client IP address from request
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

export default {
  createLogEntry,
  createBatchLogs,
  getLogs,
  getLogStats,
  getUserActivitySummary,
  getMyActivity,
  cleanupOldLogs,
};
