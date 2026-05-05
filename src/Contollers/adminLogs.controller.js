import {
  getUsersByRoleWithActivity,
  getLogsByUser,
  getUserStats,
  deleteOldLogs,
} from "../services/activityLog.service.js";

/**
 * Admin Logs Controller
 * Handles admin log dashboard operations
 */

/**
 * Get users by role (students or teachers) with last activity
 * GET /api/admin/users
 */
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role || !["student", "teacher"].includes(role)) {
      return res.status(400).json({
        error: true,
        message: "Invalid role. Must be 'student' or 'teacher'",
      });
    }

    const users = await getUsersByRoleWithActivity(role);

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("[AdminLogsController] Error fetching users:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch users",
    });
  }
};

/**
 * Get logs for a specific user
 * GET /api/admin/logs/:userId
 */
export const getUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
      level,
      startDate,
      endDate,
      search,
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: true,
        message: "User ID is required",
      });
    }

    const result = await getLogsByUser({
      userId,
      type,
      level,
      startDate,
      endDate,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: {
        page: result.page,
        limit: parseInt(limit, 10),
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
    });
  } catch (error) {
    console.error("[AdminLogsController] Error fetching user logs:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch user logs",
    });
  }
};

/**
 * Get user activity stats
 * GET /api/admin/logs/:userId/stats
 */
export const getUserActivityStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: true,
        message: "User ID is required",
      });
    }

    const stats = await getUserStats(userId, parseInt(days, 10));

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[AdminLogsController] Error fetching user stats:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch user stats",
    });
  }
};

/**
 * Manually trigger log cleanup
 * DELETE /api/admin/logs/cleanup
 */
export const triggerLogCleanup = async (req, res) => {
  try {
    const { days = 60 } = req.body;

    const result = await deleteOldLogs(parseInt(days, 10));

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Deleted ${result.deletedCount} logs older than ${days} days`,
        data: result,
      });
    } else {
      res.status(500).json({
        error: true,
        message: "Failed to cleanup logs",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("[AdminLogsController] Error triggering cleanup:", error);
    res.status(500).json({
      error: true,
      message: "Failed to cleanup logs",
    });
  }
};

/**
 * Export user logs to CSV
 * GET /api/admin/logs/:userId/export
 */
export const exportUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: true,
        message: "User ID is required",
      });
    }

    // Get all logs for the user (no pagination for export)
    const result = await getLogsByUser({
      userId,
      type,
      startDate,
      endDate,
      page: 1,
      limit: 10000,
    });

    // Convert to CSV
    const logs = result.logs;
    if (logs.length === 0) {
      return res.status(404).json({
        error: true,
        message: "No logs found for export",
      });
    }

    const headers = ["Timestamp", "Type", "Event", "Page", "IP Address", "Browser", "OS", "Device"];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.type,
      log.event,
      log.page || "",
      log.ipAddress || "",
      log.browser || "",
      log.os || "",
      log.deviceType || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((f) => `"${f}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=user-${userId}-logs.csv`);
    res.send(csv);
  } catch (error) {
    console.error("[AdminLogsController] Error exporting logs:", error);
    res.status(500).json({
      error: true,
      message: "Failed to export logs",
    });
  }
};

export default {
  getUsersByRole,
  getUserLogs,
  getUserActivityStats,
  triggerLogCleanup,
  exportUserLogs,
};
