/**
 * Application configuration from environment variables
 */

export const config = {
  // Server
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Logging
  logLevel: (process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "INFO" : "DEBUG")) as "DEBUG" | "INFO" | "WARN" | "ERROR",
  
  // Security
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  maxFilesPerRequest: Number(process.env.MAX_FILES_PER_REQUEST) || 20,
  rateLimitRequests: Number(process.env.RATE_LIMIT_REQUESTS) || 100,
  rateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  
  // Performance
  cacheMaxSize: Number(process.env.CACHE_MAX_SIZE) || 1000,
  cacheTTL: Number(process.env.CACHE_TTL) || 3600000, // 1 hour
  
  // Directories
  optimizedDir: process.env.OPTIMIZED_DIR || "optimized",
  originalsDir: process.env.ORIGINALS_DIR || "originals",
  metadataDir: process.env.METADATA_DIR || ".metadata",
  
  // Request timeout (ms)
  requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 300000, // 5 minutes
} as const;

// Validate configuration
if (config.port < 1 || config.port > 65535) {
  throw new Error("Invalid PORT configuration");
}

if (config.maxFileSize <= 0) {
  throw new Error("MAX_FILE_SIZE must be positive");
}

