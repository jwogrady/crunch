/**
 * Simple logger with levels
 * In production, integrate with proper logging service
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "INFO" : "DEBUG");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog("DEBUG")) {
      console.log("[DEBUG]", ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (shouldLog("INFO")) {
      console.log("[INFO]", ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (shouldLog("WARN")) {
      console.warn("[WARN]", ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (shouldLog("ERROR")) {
      console.error("[ERROR]", ...args);
    }
  },
};

