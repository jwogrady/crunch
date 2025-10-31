import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getAllImages } from "../../src/metadata";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const testDir = path.join(process.cwd(), "test-url-paths");
const testOptimized = path.join(testDir, "optimized");

describe("URL Construction Consistency", () => {
  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testOptimized, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  async function createTestImage(dir: string, filename: string): Promise<string> {
    const filePath = path.join(dir, filename);
    // Ensure directory exists (handles nested paths like "2025/10/31/test.jpg")
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg({ quality: 90 })
      .toFile(filePath);
    return filePath;
  }

  test("getAllImages returns relativePath without optimized/ prefix", async () => {
    await createTestImage(testOptimized, "2025/10/31/test.jpg");
    
    const images = getAllImages(testOptimized);
    expect(images.length).toBeGreaterThan(0);
    
    images.forEach((img) => {
      // relativePath should NOT start with "optimized/"
      expect(img.relativePath.startsWith("optimized/")).toBe(false);
      expect(img.relativePath.startsWith("/")).toBe(false);
      // Should be relative path like "2025/10/31/test.jpg"
      expect(img.relativePath).toMatch(/^\d{4}\/\d{2}\/\d{2}\/[\w\-\.]+\.(jpg|jpeg|png|webp)$/i);
    });
  });

  test("relativePath format matches date-based structure", async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    const dateDir = path.join(testOptimized, String(year), month, day);
    fs.mkdirSync(dateDir, { recursive: true });
    await createTestImage(dateDir, "test-image.jpg");
    
    const images = getAllImages(testOptimized);
    const testImage = images.find((img) => img.path.includes("test-image.jpg"));
    
    expect(testImage).toBeDefined();
    expect(testImage!.relativePath).toBe(`${year}/${month}/${day}/test-image.jpg`);
  });

  test("relativePath can be used directly in download URLs", async () => {
    await createTestImage(testOptimized, "2025/10/31/test.jpg");
    
    const images = getAllImages(testOptimized);
    const image = images[0];
    
    // Construct download URL
    const downloadUrl = `/download/${image.relativePath}`;
    
    // Should be valid format
    expect(downloadUrl).toBe("/download/2025/10/31/test.jpg");
    expect(downloadUrl).not.toContain("optimized/");
  });

  test("relativePath can be used in preview URLs with encoding", async () => {
    await createTestImage(testOptimized, "2025/10/31/test image.jpg");
    
    const images = getAllImages(testOptimized);
    const image = images[0];
    
    // Construct preview URL
    const previewUrl = `/api/images/${encodeURIComponent(image.relativePath)}/preview`;
    
    // Should be valid format
    expect(previewUrl).toContain("/api/images/");
    expect(previewUrl).toContain("/preview");
    expect(previewUrl).not.toContain("optimized/");
  });

  test("relativePath format is consistent across multiple images", async () => {
    await createTestImage(testOptimized, "2025/10/31/image1.jpg");
    await createTestImage(testOptimized, "2025/10/31/image2.jpg");
    await createTestImage(testOptimized, "2024/11/15/image3.jpg");
    
    const images = getAllImages(testOptimized);
    expect(images.length).toBe(3);
    
    // All should have consistent format
    images.forEach((img) => {
      expect(img.relativePath).toMatch(/^\d{4}\/\d{2}\/\d{2}\//);
      expect(img.relativePath).not.toContain("optimized");
      expect(img.relativePath).not.toStartWith("/");
    });
    
    // Verify specific paths
    const paths = images.map((img) => img.relativePath).sort();
    expect(paths).toContain("2024/11/15/image3.jpg");
    expect(paths).toContain("2025/10/31/image1.jpg");
    expect(paths).toContain("2025/10/31/image2.jpg");
  });
});

