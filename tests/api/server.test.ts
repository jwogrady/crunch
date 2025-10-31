import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Elysia } from "elysia";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Import server routes (we'll test the logic, not the full server)
import { CONSTANTS } from "../../src/utils/constants";
import { validateImagePath } from "../../src/server/utils/security";

describe("Server Security", () => {
  test("validateImagePath prevents directory traversal", () => {
    const result = validateImagePath("../../../etc/passwd", CONSTANTS.OPTIMIZED_DIR);
    expect(result.valid).toBe(false);
  });

  test("validateImagePath allows valid paths", () => {
    const result = validateImagePath("2024/12/19/image.jpg", CONSTANTS.OPTIMIZED_DIR);
    expect(result.valid).toBe(true);
  });

  test("validateImagePath rejects paths with leading slash", () => {
    const result = validateImagePath("/etc/passwd", CONSTANTS.OPTIMIZED_DIR);
    expect(result.valid).toBe(false);
  });
});

describe("File Validation", () => {
  test("validates file types correctly", () => {
    const { validateFileType } = require("../../src/utils/constants");
    expect(validateFileType("image.jpg")).toBe(true);
    expect(validateFileType("file.txt")).toBe(false);
  });

  test("validates file sizes correctly", () => {
    const { validateFileSize, CONSTANTS } = require("../../src/utils/constants");
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(CONSTANTS.MAX_FILE_SIZE + 1)).toBe(false);
  });
});

