import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { optimizeImage, OptimizationOptions } from "../../src/optimizer";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const testDir = path.join(process.cwd(), "test-optimizer-paths");
const testOptimized = path.join(testDir, "optimized");
const testOriginals = path.join(testDir, "originals");

describe("Optimizer Path Consistency", () => {
  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testOptimized, { recursive: true });
    fs.mkdirSync(testOriginals, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

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

  test("optimizeImage generates relativePath without optimized/ prefix", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      testOptimized,
      testOriginals
    );

    expect(results.length).toBe(1);
    
    // Check that output path is absolute and contains date structure
    expect(path.isAbsolute(results[0].output)).toBe(true);
    expect(results[0].output).toContain(testOptimized);
    expect(results[0].output).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  test("optimizeImage output path format matches getAllImages format", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      testOptimized,
      testOriginals
    );

    // Get relative path from output
    const relativeFromOutput = path.relative(testOptimized, results[0].output).replace(/\\/g, "/");
    
    // Now get all images and verify format matches
    const { getAllImages } = await import("../../src/metadata");
    const images = getAllImages(testOptimized);
    const foundImage = images.find((img) => img.path === results[0].output);
    
    expect(foundImage).toBeDefined();
    expect(foundImage!.relativePath).toBe(relativeFromOutput);
    expect(foundImage!.relativePath).not.toContain("optimized/");
  });

  test("optimizeImage works with custom outputDir name", async () => {
    const customDir = path.join(testDir, "custom-optimized");
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      customDir,
      testOriginals
    );

    expect(results.length).toBe(1);
    expect(results[0].output).toContain(customDir);
    expect(results[0].output).not.toContain("optimized");
  });

  test("optimizeImage creates date-based folder structure", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      testOptimized,
      testOriginals
    );

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const expectedDir = path.join(testOptimized, String(year), month, day);
    
    expect(fs.existsSync(expectedDir)).toBe(true);
    expect(results[0].output).toContain(path.join(String(year), month, day));
  });

  test("optimizeImage output can be converted to download URL format", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      testOptimized,
      testOriginals
    );

    // Simulate server.ts URL construction
    const relativePath = results[0].output.replace(/\\/g, "/").replace(/^.*?optimized\//, "");
    const downloadUrl = `/download/${relativePath}`;
    
    // Should be valid format
    expect(downloadUrl).toMatch(/^\/download\/\d{4}\/\d{2}\/\d{2}\//);
    expect(downloadUrl).not.toContain("optimized/");
    expect(downloadUrl).toContain(".webp");
  });

  test("optimizeImage output matches expected relativePath in metadata", async () => {
    const buffer = await createTestImage();
    const options: OptimizationOptions = {
      width: 100,
      quality: 85,
      format: "webp",
    };

    const results = await optimizeImage(
      buffer,
      "test.jpg",
      options,
      testOptimized,
      testOriginals
    );

    // Load metadata to verify relativePath
    const { loadMetadata } = await import("../../src/metadata");
    const relativePath = path.relative(testOptimized, results[0].output).replace(/\\/g, "/");
    const metadata = loadMetadata(results[0].output, relativePath, results[0].originalPath);
    
    expect(metadata).toBeTruthy();
    expect(metadata!.relativePath).toBe(relativePath);
    expect(metadata!.relativePath).not.toContain("optimized/");
  });
});

