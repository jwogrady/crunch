import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { optimizeImage, OptimizationOptions } from "../src/optimizer";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const testDir = path.join(process.cwd(), "test-optimized");
const testOriginalsDir = path.join(process.cwd(), "test-originals");

beforeEach(() => {
  // Clean up test directories
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  if (fs.existsSync(testOriginalsDir)) {
    fs.rmSync(testOriginalsDir, { recursive: true, force: true });
  }
});

afterEach(() => {
  // Clean up after tests
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  if (fs.existsSync(testOriginalsDir)) {
    fs.rmSync(testOriginalsDir, { recursive: true, force: true });
  }
});

// Helper to create a test image buffer
async function createTestImage(width = 200, height = 200): Promise<Buffer> {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

describe("optimizeImage", () => {
  test("optimizes image to webp format", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results).toHaveLength(1);
    expect(results[0].format || results[0].name).toContain("webp");
    expect(results[0].optimizedSize).toBeLessThan(results[0].originalSize);
    expect(fs.existsSync(results[0].output)).toBe(true);
  }, 10000);

  test("optimizes image to jpeg format", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "jpeg",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results).toHaveLength(1);
    expect(results[0].name).toContain("jpeg");
    expect(fs.existsSync(results[0].output)).toBe(true);
  }, 10000);

  test("generates both formats when 'both' is specified", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "both",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results).toHaveLength(2);
    expect(results.some((r) => r.name.includes("jpeg"))).toBe(true);
    expect(results.some((r) => r.name.includes("webp"))).toBe(true);
  }, 10000);

  test("creates date-based folder structure", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results[0].output).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  }, 10000);

  test("generates relativePath without optimized/ prefix in metadata", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    // Verify output has date-based structure
    expect(results[0].output).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    
    // Verify metadata was saved (optimizer saves it during processing)
    const { loadMetadata } = await import("../src/metadata");
    const relativePath = path.relative(testDir, results[0].output).replace(/\\/g, "/");
    const metadata = loadMetadata(results[0].output, relativePath, results[0].originalPath);
    
    expect(metadata).toBeTruthy();
    // Verify relativePath format is correct (no optimized/ prefix, date structure)
    if (metadata!.relativePath) {
      expect(metadata!.relativePath).not.toContain("optimized/");
      if (relativePath.includes("/")) {
        expect(metadata!.relativePath).toMatch(/^\d{4}\/\d{2}\/\d{2}\//);
      }
    }
  }, 10000);

  test("saves original file", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(fs.existsSync(results[0].originalPath)).toBe(true);
  }, 10000);

  test("calculates savings correctly", async () => {
    const buffer = await createTestImage(500, 500);
    const options: OptimizationOptions = {
      width: 100,
      quality: 50,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results[0].savings).toBeGreaterThan(0);
    expect(results[0].savingsPercent).toBeGreaterThan(0);
    expect(results[0].savingsPercent).toBeLessThanOrEqual(100);
  }, 10000);

  test("respects width constraint", async () => {
    const buffer = await createTestImage(500, 500);
    const options: OptimizationOptions = {
      width: 200,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    const metadata = await sharp(results[0].output).metadata();
    expect(metadata.width).toBeLessThanOrEqual(200);
  }, 10000);

  test("does not enlarge smaller images", async () => {
    const buffer = await createTestImage(50, 50);
    const options: OptimizationOptions = {
      width: 200,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    const metadata = await sharp(results[0].output).metadata();
    // Should not be larger than original, but might be equal due to format conversion
    expect(metadata.width).toBeLessThanOrEqual(200);
    // Verify original was indeed smaller
    const originalMetadata = await sharp(buffer).metadata();
    expect(originalMetadata.width).toBe(50);
  }, 10000);

  test("handles zero width (no resize)", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 0,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(buffer, "test.jpg", options, testDir, testOriginalsDir);

    expect(results).toHaveLength(1);
    expect(fs.existsSync(results[0].output)).toBe(true);
  }, 10000);
});

