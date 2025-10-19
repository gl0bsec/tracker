/**
 * Data caching utility for CSV data
 * Caches fetched data in sessionStorage to improve load times
 */

const CACHE_KEY = "event-data-cache"
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

interface CachedData {
  data: string
  timestamp: number
}

/**
 * Get cached data if it exists and is still valid
 */
export function getCachedData(): string | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsed: CachedData = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_DURATION) {
      return parsed.data
    }

    // Cache expired, remove it
    sessionStorage.removeItem(CACHE_KEY)
    return null
  } catch (error) {
    // If any error occurs, just return null and fetch fresh data
    console.warn("Cache read error:", error)
    return null
  }
}

/**
 * Store data in cache with current timestamp
 */
export function setCachedData(data: string): void {
  try {
    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch (error) {
    // If storage is full or unavailable, silently fail
    console.warn("Cache write error:", error)
  }
}

/**
 * Clear the cache (useful for manual refresh)
 */
export function clearCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.warn("Cache clear error:", error)
  }
}
