import { resolveBulk, getCacheStats } from "../services/idResolver.service.js";

/**
 * Bulk resolve IDs to human-readable names
 * POST /api/admin/resolve-ids
 */
export const resolveIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Missing required field: ids array is required",
      });
    }

    // Validate each entry
    const validIds = ids.filter(
      (item) => item && typeof item.type === "string" && typeof item.id === "string"
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        error: true,
        message: "No valid id entries provided. Each must have 'type' and 'id'",
      });
    }

    // Enforce max batch size to prevent abuse
    const MAX_BATCH_SIZE = 200;
    const batch = validIds.slice(0, MAX_BATCH_SIZE);

    const resolved = await resolveBulk(batch);

    res.status(200).json({
      success: true,
      data: resolved,
      meta: {
        requested: ids.length,
        resolved: Object.keys(resolved).length,
        batched: batch.length,
      },
    });
  } catch (error) {
    console.error("[IdResolverController] Error resolving IDs:", error);
    res.status(500).json({
      error: true,
      message: "Failed to resolve IDs",
    });
  }
};

/**
 * Get cache stats (admin monitoring)
 * GET /api/admin/resolve-ids/stats
 */
export const getResolverStats = async (req, res) => {
  try {
    const stats = getCacheStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[IdResolverController] Error fetching stats:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch resolver stats",
    });
  }
};

export default {
  resolveIds,
  getResolverStats,
};
