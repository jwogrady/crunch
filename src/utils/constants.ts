// Application Constants
export const CONSTANTS = {
  DEFAULT_WIDTH: 1600,
  DEFAULT_QUALITY: 85,
  DEFAULT_FORMAT: "webp" as const,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  THUMBNAIL_SIZE: 400,
  THUMBNAIL_QUALITY: 80,
  METADATA_DIR: ".metadata",
  OPTIMIZED_DIR: "optimized",
  ORIGINALS_DIR: "originals",
  CACHE_TTL: 3600000, // 1 hour in ms
} as const;

export const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

export const SEO_FILENAME_MAX_LENGTH = 100;

// Validation helpers (moved from server/utils/security for reuse)
export function validateFileType(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return (SUPPORTED_FORMATS as readonly string[]).includes(ext);
}

export function validateFileSize(size: number, maxSize: number = CONSTANTS.MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize;
}

