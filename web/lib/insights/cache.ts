/**
 * Re-export insights cache from shared package
 * 
 * @deprecated Use @liftledger/shared instead
 * This file is kept for backward compatibility.
 */

export {
  getCachedInsight,
  setCachedInsight,
  clearCacheEntry,
  clearAllCache,
  cleanupExpiredCache,
} from "@liftledger/shared";

