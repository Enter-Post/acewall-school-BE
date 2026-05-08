import mongoose from "mongoose";

/**
 * ID Resolver Service
 * Centralized entity name resolution with in-memory caching
 */

// In-memory cache: Map<key, { name: string, expiresAt: number }>
const cache = new Map();

// TTL in milliseconds (10 minutes)
const CACHE_TTL_MS = 10 * 60 * 1000;

// Supported entity configurations
const ENTITY_CONFIG = {
  user: {
    modelName: "User",
    modelPath: "../Models/user.model.js",
    fields: ["firstName", "lastName", "email"],
    format: (doc) => {
      const name = [doc.firstName, doc.lastName].filter(Boolean).join(" ").trim();
      return name || doc.email || "[Unknown User]";
    },
  },
  course: {
    modelName: "CourseSch",
    modelPath: "../Models/courses.model.sch.js",
    fields: ["courseTitle"],
    format: (doc) => doc.courseTitle || "[Deleted Course]",
  },
  semester: {
    modelName: "Semester",
    modelPath: "../Models/semester.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Semester]",
  },
  quarter: {
    modelName: "Quarter",
    modelPath: "../Models/quarter.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Quarter]",
  },
  chapter: {
    modelName: "Chapter",
    modelPath: "../Models/chapter.model.sch.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Chapter]",
  },
  assessment: {
    modelName: "assessment",
    modelPath: "../Models/Assessment.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Assessment]",
  },
  assessmentCategory: {
    modelName: "AssessmentCategory",
    modelPath: "../Models/assessmentCategory.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Assessment Category]",
  },
  lesson: {
    modelName: "Lesson",
    modelPath: "../Models/lesson.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Lesson]",
  },
  discussion: {
    modelName: "Discussion",
    modelPath: "../Models/discussion.model.js",
    fields: ["title"],
    format: (doc) => doc.title || "[Deleted Discussion]",
  },
};

// Model cache to avoid repeated dynamic imports
const modelCache = new Map();

/**
 * Get cached model or dynamically import it
 */
const getModel = async (entityType) => {
  const config = ENTITY_CONFIG[entityType];
  if (!config) return null;

  if (modelCache.has(config.modelName)) {
    return modelCache.get(config.modelName);
  }

  try {
    const mod = await import(config.modelPath);
    const Model = mod.default || mod[config.modelName];
    if (Model) {
      modelCache.set(config.modelName, Model);
    }
    return Model;
  } catch (err) {
    console.error(`[IdResolver] Failed to load model for ${entityType}:`, err.message);
    return null;
  }
};

/**
 * Build cache key
 */
const buildCacheKey = (entityType, id) => `${entityType}:${id}`;

/**
 * Get cached value if valid
 */
const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.name;
};

/**
 * Set cache value
 */
const setCached = (key, name) => {
  cache.set(key, {
    name,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

/**
 * Resolve a single entity name
 * @param {string} entityType - e.g. 'user', 'course'
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<string>}
 */
export const resolveEntityName = async (entityType, id) => {
  if (!id || id === "null" || id === "undefined") {
    if (entityType === "user") return "Guest User";
    return `[Deleted ${entityType}]`;
  }

  const config = ENTITY_CONFIG[entityType];
  if (!config) return `[Unknown ${entityType}]`;

  const cacheKey = buildCacheKey(entityType, id);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const Model = await getModel(entityType);
    if (!Model) return `[Deleted ${entityType}]`;

    const doc = await Model.findById(id).select(config.fields.join(" ")).lean();
    if (!doc) {
      const fallback = `[Deleted ${entityType}]`;
      setCached(cacheKey, fallback);
      return fallback;
    }

    const name = config.format(doc);
    setCached(cacheKey, name);
    return name;
  } catch (error) {
    console.error(`[IdResolver] Error resolving ${entityType}:${id}:`, error.message);
    return `[Deleted ${entityType}]`;
  }
};

/**
 * Resolve multiple IDs in bulk (performance optimized)
 * @param {Array<{type: string, id: string}>} ids
 * @returns {Promise<Record<string, string>>}
 */
export const resolveBulk = async (ids) => {
  const results = {};
  const toFetch = {};

  // Deduplicate and check cache
  const seen = new Set();
  for (const { type, id } of ids) {
    if (!id || !type) continue;
    const dedupKey = `${type}:${id}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const cached = getCached(dedupKey);
    if (cached !== null) {
      results[dedupKey] = cached;
    } else {
      if (!toFetch[type]) toFetch[type] = new Set();
      toFetch[type].add(id);
    }
  }

  // Batch fetch by entity type
  await Promise.all(
    Object.entries(toFetch).map(async ([entityType, idSet]) => {
      const config = ENTITY_CONFIG[entityType];
      if (!config) {
        for (const id of idSet) {
          const key = buildCacheKey(entityType, id);
          results[key] = `[Unknown ${entityType}]`;
        }
        return;
      }

      try {
        const Model = await getModel(entityType);
        if (!Model) {
          for (const id of idSet) {
            const key = buildCacheKey(entityType, id);
            const fallback = `[Deleted ${entityType}]`;
            setCached(key, fallback);
            results[key] = fallback;
          }
          return;
        }

        const objectIds = Array.from(idSet)
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const docs = await Model.find({ _id: { $in: objectIds } })
          .select(config.fields.join(" "))
          .lean();

        const docMap = new Map(docs.map((d) => [d._id.toString(), d]));

        for (const id of idSet) {
          const key = buildCacheKey(entityType, id);
          const doc = docMap.get(id);
          if (doc) {
            const name = config.format(doc);
            setCached(key, name);
            results[key] = name;
          } else {
            const fallback = `[Deleted ${entityType}]`;
            setCached(key, fallback);
            results[key] = fallback;
          }
        }
      } catch (error) {
        console.error(`[IdResolver] Bulk error for ${entityType}:`, error.message);
        for (const id of idSet) {
          const key = buildCacheKey(entityType, id);
          results[key] = "[Unknown]";
        }
      }
    })
  );

  return results;
};

/**
 * Clear the entire cache (useful for testing or admin ops)
 */
export const clearResolverCache = () => {
  cache.clear();
};

/**
 * Get cache stats for monitoring
 */
export const getCacheStats = () => ({
  size: cache.size,
  ttlMinutes: CACHE_TTL_MS / 60 / 1000,
});

export default {
  resolveEntityName,
  resolveBulk,
  clearResolverCache,
  getCacheStats,
};
