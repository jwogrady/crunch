import fs from "fs";
import path from "path";
import sharp from "sharp";
import { CONSTANTS } from "../../utils/constants";
import { config } from "../../utils/config";
import { ImageMetadata } from "../../metadata";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * LRU Cache with size limits
 */
class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = config.cacheMaxSize) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T, ttl: number = CONSTANTS.CACHE_TTL): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Expose cache map for invalidation (with proper typing)
  getCacheMap(): Map<string, CacheEntry<T>> {
    return this.cache;
  }
}

// Global caches
export const thumbnailCache = new SimpleCache<Buffer>();
export const metadataCache = new SimpleCache<ImageMetadata>();

/**
 * Get or generate thumbnail with caching
 */
export async function getCachedThumbnail(
  imagePath: string,
  size: number = CONSTANTS.THUMBNAIL_SIZE
): Promise<Buffer> {
  const cacheKey = `${imagePath}-${size}`;
  
  // Check cache first
  const cached = thumbnailCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Verify file exists before processing
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  // Generate thumbnail
  try {
    const thumbnail = await sharp(imagePath)
      .resize(size, null, { withoutEnlargement: true })
      .webp({ quality: CONSTANTS.THUMBNAIL_QUALITY })
      .toBuffer();

    // Cache for 1 hour
    thumbnailCache.set(cacheKey, thumbnail, CONSTANTS.CACHE_TTL);
    
    return thumbnail;
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Failed to generate thumbnail for ${imagePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Invalidate cache for an image
 */
export function invalidateImageCache(imagePath: string): void {
  // Invalidate all cache entries for this image
  const cache = thumbnailCache.getCacheMap();
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.startsWith(imagePath)) {
      thumbnailCache.delete(key);
    }
  });
  metadataCache.delete(imagePath);
}

