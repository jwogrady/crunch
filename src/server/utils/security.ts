import path from "path";
import { validatePath, sanitizePath } from "../../utils/helpers";

/**
 * Validate and sanitize image path for security
 */
export function validateImagePath(
  relativePath: string,
  baseDir: string = "optimized"
): { valid: boolean; filePath?: string; error?: string } {
  // Check for directory traversal attempts first (before sanitization)
  if (relativePath.includes("..") || relativePath.startsWith("/")) {
    return { valid: false, error: "Invalid path: directory traversal detected" };
  }

  // Normalize path: remove baseDir prefix if present
  let normalizedPath = relativePath.replace(/\\/g, "/");
  const baseDirNormalized = baseDir.replace(/\\/g, "/");
  
  // Remove leading baseDir if present (handles both "optimized/" and "optimized\")
  // Only remove if followed by slash or at end of string (to avoid removing partial matches)
  if (normalizedPath.toLowerCase().startsWith(baseDirNormalized.toLowerCase() + "/")) {
    normalizedPath = normalizedPath.substring(baseDirNormalized.length + 1);
  } else if (normalizedPath.toLowerCase() === baseDirNormalized.toLowerCase()) {
    // Edge case: path is exactly "optimized" - invalid, needs actual file path
    return { valid: false, error: "Invalid path: must include file path, not just directory" };
  } else if (normalizedPath.toLowerCase().startsWith(baseDirNormalized.toLowerCase())) {
    // Handle case where baseDir is at start but not followed by slash (shouldn't happen but be safe)
    normalizedPath = normalizedPath.substring(baseDirNormalized.length);
  }
  
  // Remove any leading slashes after normalization
  normalizedPath = normalizedPath.replace(/^\/+/, "");
  
  // Ensure we have a non-empty path after normalization
  if (!normalizedPath || normalizedPath.trim() === "") {
    return { valid: false, error: "Invalid path: empty path after normalization" };
  }

  // Sanitize path
  const sanitized = sanitizePath(normalizedPath);
  
  // Double-check after sanitization
  if (sanitized.includes("..") || sanitized.startsWith("/")) {
    return { valid: false, error: "Invalid path: directory traversal detected" };
  }

  // Join with baseDir - sanitized path is relative to baseDir
  const filePath = path.join(baseDir, sanitized);
  
  // Resolve to absolute path for security check
  const resolvedFilePath = path.resolve(filePath);
  const resolvedBaseDir = path.resolve(baseDir);
  
  // Additional security check - ensure path is within base directory
  if (!resolvedFilePath.startsWith(resolvedBaseDir)) {
    return { valid: false, error: "Invalid path: outside allowed directory" };
  }

  // Return the resolved absolute path
  return { valid: true, filePath: resolvedFilePath };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
  return size <= maxSize;
}

/**
 * Validate file type
 */
export function validateFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
}

