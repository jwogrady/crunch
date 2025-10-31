import { describe, test, expect } from "bun:test";
import { formatBytes, sanitizePath, isImageFile } from "../../src/utils/helpers";

describe("Edge Cases - formatBytes", () => {
  test("handles very small values", () => {
    expect(formatBytes(1)).toBe("1 Bytes");
  });

  test("handles negative values gracefully", () => {
    // Should not crash, but behavior may vary
    const result = formatBytes(-100);
    expect(typeof result).toBe("string");
  });

  test("handles very large values", () => {
    const result = formatBytes(1125899906842624); // Very large number
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Edge Cases - sanitizePath", () => {
  test("handles empty string", () => {
    expect(sanitizePath("")).toBe("");
  });

  test("handles only slashes", () => {
    const result = sanitizePath("///");
    expect(result).toBeDefined();
  });

  test("handles paths with many traversal attempts", () => {
    const result = sanitizePath("../../../../../etc/passwd");
    expect(result).not.toContain("..");
    expect(result).toBeDefined();
  });
});

describe("Edge Cases - isImageFile", () => {
  test("handles files without extension", () => {
    expect(isImageFile("file")).toBe(false);
  });

  test("handles empty string", () => {
    expect(isImageFile("")).toBe(false);
  });

  test("handles files with only extension", () => {
    expect(isImageFile(".jpg")).toBe(false); // No filename
  });
});

