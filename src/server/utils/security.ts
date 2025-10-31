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

  // Sanitize path
  const sanitized = sanitizePath(relativePath);
  
  // Double-check after sanitization
  if (sanitized.includes("..") || sanitized.startsWith("/")) {
    return { valid: false, error: "Invalid path: directory traversal detected" };
  }

  // Join with baseDir - sanitized path is relative
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

