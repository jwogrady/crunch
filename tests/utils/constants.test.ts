import { describe, test, expect } from "bun:test";
import { CONSTANTS, SUPPORTED_FORMATS, validateFileType, validateFileSize } from "../../src/utils/constants";

describe("CONSTANTS", () => {
  test("has all required constants", () => {
    expect(CONSTANTS.DEFAULT_WIDTH).toBe(1600);
    expect(CONSTANTS.DEFAULT_QUALITY).toBe(85);
    expect(CONSTANTS.DEFAULT_FORMAT).toBe("webp");
    expect(CONSTANTS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    expect(CONSTANTS.THUMBNAIL_SIZE).toBe(400);
    expect(CONSTANTS.THUMBNAIL_QUALITY).toBe(80);
    expect(CONSTANTS.METADATA_DIR).toBe(".metadata");
    expect(CONSTANTS.OPTIMIZED_DIR).toBe("optimized");
    expect(CONSTANTS.ORIGINALS_DIR).toBe("originals");
    expect(CONSTANTS.CACHE_TTL).toBe(3600000);
  });
});

describe("SUPPORTED_FORMATS", () => {
  test("contains all image formats", () => {
    expect(SUPPORTED_FORMATS).toContain(".jpg");
    expect(SUPPORTED_FORMATS).toContain(".jpeg");
    expect(SUPPORTED_FORMATS).toContain(".png");
    expect(SUPPORTED_FORMATS).toContain(".webp");
    expect(SUPPORTED_FORMATS).toContain(".gif");
  });
});

describe("validateFileType", () => {
  test("validates image file types", () => {
    expect(validateFileType("image.jpg")).toBe(true);
    expect(validateFileType("image.jpeg")).toBe(true);
    expect(validateFileType("image.png")).toBe(true);
    expect(validateFileType("image.webp")).toBe(true);
    expect(validateFileType("image.gif")).toBe(true);
    expect(validateFileType("image.JPG")).toBe(true);
  });

  test("rejects invalid file types", () => {
    expect(validateFileType("file.txt")).toBe(false);
    expect(validateFileType("file.pdf")).toBe(false);
    expect(validateFileType("file")).toBe(false);
  });
});

describe("validateFileSize", () => {
  test("validates file size within limits", () => {
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(1024 * 1024)).toBe(true);
    expect(validateFileSize(CONSTANTS.MAX_FILE_SIZE)).toBe(true);
  });

  test("rejects files exceeding max size", () => {
    expect(validateFileSize(CONSTANTS.MAX_FILE_SIZE + 1)).toBe(false);
    expect(validateFileSize(100 * 1024 * 1024)).toBe(false);
  });

  test("rejects zero or negative sizes", () => {
    expect(validateFileSize(0)).toBe(false);
    expect(validateFileSize(-1)).toBe(false);
  });

  test("accepts custom max size", () => {
    expect(validateFileSize(1024, 2048)).toBe(true);
    expect(validateFileSize(2048, 2048)).toBe(true);
    expect(validateFileSize(2049, 2048)).toBe(false);
  });
});

