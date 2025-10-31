import { describe, test, expect } from "bun:test";
import { validateImagePath, validateFileSize, validateFileType } from "../../../src/server/utils/security";
import path from "path";

describe("validateImagePath", () => {
  test("validates correct paths", () => {
    const result = validateImagePath("2024/12/19/image.jpg", "optimized");
    expect(result.valid).toBe(true);
    expect(result.filePath).toBeDefined();
  });

  test("rejects directory traversal attempts", () => {
    const result = validateImagePath("../../../etc/passwd", "optimized");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("rejects paths starting with slash", () => {
    const result = validateImagePath("/etc/passwd", "optimized");
    // May be sanitized, but should not be valid as-is
    expect(result.error || !result.valid).toBeTruthy();
  });

  test("rejects empty paths", () => {
    const result = validateImagePath("", "optimized");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("handles nested paths", () => {
    const result = validateImagePath("2024/12/19/subfolder/image.jpg", "optimized");
    expect(result.valid).toBe(true);
  });

  test("normalizes paths with optimized/ prefix", () => {
    const withPrefix = validateImagePath("optimized/2024/12/19/image.jpg", "optimized");
    const withoutPrefix = validateImagePath("2024/12/19/image.jpg", "optimized");
    
    expect(withPrefix.valid).toBe(true);
    expect(withoutPrefix.valid).toBe(true);
    // Both should resolve to same absolute path
    expect(path.resolve(withPrefix.filePath!)).toBe(path.resolve(withoutPrefix.filePath!));
  });

  test("rejects path that is exactly 'optimized'", () => {
    const result = validateImagePath("optimized", "optimized");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("file path");
  });

  test("rejects empty path after normalization", () => {
    const result = validateImagePath("optimized/", "optimized");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  test("returns absolute resolved paths", () => {
    const result = validateImagePath("2024/12/19/image.jpg", "optimized");
    expect(result.valid).toBe(true);
    expect(path.isAbsolute(result.filePath!)).toBe(true);
  });
});

describe("validateFileSize", () => {
  test("validates file sizes", () => {
    expect(validateFileSize(1024, 2048)).toBe(true);
    expect(validateFileSize(2048, 2048)).toBe(true);
    expect(validateFileSize(2049, 2048)).toBe(false);
  });

  test("uses default max size", () => {
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(100 * 1024 * 1024)).toBe(false);
  });
});

describe("validateFileType", () => {
  test("validates image file types", () => {
    expect(validateFileType("image.jpg")).toBe(true);
    expect(validateFileType("image.png")).toBe(true);
    expect(validateFileType("file.txt")).toBe(false);
  });
});

