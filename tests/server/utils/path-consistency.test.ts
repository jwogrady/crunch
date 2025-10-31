import { describe, test, expect } from "bun:test";
import { validateImagePath } from "../../../src/server/utils/security";
import path from "path";
import { CONSTANTS } from "../../../src/utils/constants";

describe("Path Consistency - validateImagePath", () => {
  describe("Path normalization", () => {
    test("normalizes paths with optimized/ prefix", () => {
      const result = validateImagePath("optimized/2025/10/31/file.webp", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
      // Should resolve to same path as without prefix
      const withoutPrefix = validateImagePath("2025/10/31/file.webp", CONSTANTS.OPTIMIZED_DIR);
      expect(path.resolve(result.filePath!)).toBe(path.resolve(withoutPrefix.filePath!));
    });

    test("normalizes paths without optimized/ prefix", () => {
      const result = validateImagePath("2025/10/31/file.webp", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.filePath).toContain("optimized");
      expect(result.filePath).toContain("2025/10/31/file.webp");
    });

    test("rejects path that is exactly 'optimized'", () => {
      const result = validateImagePath("optimized", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("file path");
    });

    test("rejects empty path after normalization", () => {
      const result = validateImagePath("optimized/", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });

    test("handles paths with optimized/ in the middle", () => {
      // Path like "sub/optimized/file.jpg" should be valid (optimized is just part of filename/dir)
      const result = validateImagePath("sub/optimized/file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    test("normalizes case-insensitive baseDir prefix", () => {
      const result1 = validateImagePath("optimized/2025/file.jpg", CONSTANTS.OPTIMIZED_DIR);
      const result2 = validateImagePath("OPTIMIZED/2025/file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(path.resolve(result1.filePath!)).toBe(path.resolve(result2.filePath!));
    });

    test("handles Windows-style paths", () => {
      const result = validateImagePath("optimized\\2025\\10\\file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
    });
  });

  describe("Security validation", () => {
    test("rejects directory traversal attempts", () => {
      const result = validateImagePath("../../../etc/passwd", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("directory traversal");
    });

    test("rejects paths starting with slash", () => {
      const result = validateImagePath("/etc/passwd", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("directory traversal");
    });

    test("validates paths stay within base directory", () => {
      const result = validateImagePath("2025/10/31/file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      const resolvedPath = path.resolve(result.filePath!);
      const resolvedBase = path.resolve(CONSTANTS.OPTIMIZED_DIR);
      expect(resolvedPath.startsWith(resolvedBase)).toBe(true);
    });

    test("rejects paths with optimized/ prefix and traversal", () => {
      const result = validateImagePath("optimized/../../etc/passwd", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    test("handles deeply nested paths", () => {
      const deepPath = "2025/10/31/sub1/sub2/sub3/image.jpg";
      const result = validateImagePath(deepPath, CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    test("handles files at root of optimized directory", () => {
      const result = validateImagePath("file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    test("handles paths with special characters in filename", () => {
      const result = validateImagePath("2025/10/31/test-image_file.webp", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    test("handles paths with spaces (should be sanitized)", () => {
      // Spaces should be handled by sanitizePath
      const result = validateImagePath("2025/10/31/my file.jpg", CONSTANTS.OPTIMIZED_DIR);
      // Result depends on sanitizePath behavior
      expect(result.filePath).toBeDefined();
    });
  });

  describe("Path format consistency", () => {
    test("returns absolute paths consistently", () => {
      const result = validateImagePath("2025/10/31/file.jpg", CONSTANTS.OPTIMIZED_DIR);
      expect(result.valid).toBe(true);
      expect(path.isAbsolute(result.filePath!)).toBe(true);
    });

    test("different input formats produce same resolved path", () => {
      const path1 = "optimized/2025/10/31/file.jpg";
      const path2 = "2025/10/31/file.jpg";
      
      const result1 = validateImagePath(path1, CONSTANTS.OPTIMIZED_DIR);
      const result2 = validateImagePath(path2, CONSTANTS.OPTIMIZED_DIR);
      
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(path.resolve(result1.filePath!)).toBe(path.resolve(result2.filePath!));
    });
  });
});

