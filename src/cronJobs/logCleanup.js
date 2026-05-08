import cron from "node-cron";
import { deleteOldLogs } from "../services/activityLog.service.js";

/**
 * Log Cleanup Cron Job
 * Automatically deletes logs older than 60 days
 * Runs daily at midnight (0 0 * * *)
 */

export const startLogCleanupJob = () => {
  // Run at midnight every day
  cron.schedule("0 0 * * *", async () => {
    console.log("[LogCleanup] Starting daily log cleanup...");

    try {
      const result = await deleteOldLogs(60);

      if (result.success) {
        console.log(`[LogCleanup] Successfully deleted ${result.deletedCount} old logs`);
      } else {
        console.error("[LogCleanup] Failed to delete old logs:", result.error);
      }
    } catch (error) {
      // Don't crash the app if cron fails
      console.error("[LogCleanup] Error in cleanup job:", error.message);
    }
  });

  console.log("[LogCleanup] Log cleanup cron job started (runs daily at midnight)");
};

export default startLogCleanupJob;
