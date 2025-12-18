/**
 * LiftLedger Insights Cache
 * 
 * Simple in-memory cache to reduce redundant API calls.
 * Cache entries expire after a TTL period.
 * 
 * Platform-agnostic implementation.
 */

import type { ProgressInsight } from "./api";

interface CacheEntry {
  insight: ProgressInsight;
  timestamp: number; // Unix timestamp in milliseconds
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache: Map<exerciseId_metric, CacheEntry>
const cache = new Map<string, CacheEntry>();

/**
 * Get cache key for an exercise and metric
 */
function getCacheKey(exerciseId: string, metric: string): string {
  return `${exerciseId}_${metric}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Get cached insight if available and valid
 * 
 * @param exerciseId - Exercise ID or name
 * @param metric - Metric name
 * @returns Cached insight or null if not found/expired
 */
export function getCachedInsight(
  exerciseId: string,
  metric: string
): ProgressInsight | null {
  const key = getCacheKey(exerciseId, metric);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (!isCacheValid(entry)) {
    // Remove expired entry
    cache.delete(key);
    return null;
  }

  return entry.insight;
}

/**
 * Store insight in cache
 * 
 * @param exerciseId - Exercise ID or name
 * @param metric - Metric name
 * @param insight - Progress insight to cache
 */
export function setCachedInsight(
  exerciseId: string,
  metric: string,
  insight: ProgressInsight
): void {
  const key = getCacheKey(exerciseId, metric);
  cache.set(key, {
    insight,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache entry for a specific exercise and metric
 * 
 * @param exerciseId - Exercise ID or name
 * @param metric - Metric name
 */
export function clearCacheEntry(exerciseId: string, metric: string): void {
  const key = getCacheKey(exerciseId, metric);
  cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): void {
  const keysToDelete: string[] = [];
  cache.forEach((entry, key) => {
    if (!isCacheValid(entry)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => cache.delete(key));
}

