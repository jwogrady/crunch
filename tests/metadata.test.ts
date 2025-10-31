import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  extractImageMetadata,
  loadMetadata,
  saveMetadata,
  generateSEOFilename,
  renameImage,
  getAllImages,
  ImageMetadata,
} from "../src/metadata";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const testImageDir = path.join(process.cwd(), "test-images");
const testMetadataDir = path.join(process.cwd(), ".metadata-test");

beforeEach(() => {
  // Create test directories
  if (!fs.existsSync(testImageDir)) {
    fs.mkdirSync(testImageDir, { recursive: true });
  }
  if (!fs.existsSync(testMetadataDir)) {
    fs.mkdirSync(testMetadataDir, { recursive: true });
  }
});

afterEach(() => {
  // Clean up test directories
  if (fs.existsSync(testImageDir)) {
    fs.rmSync(testImageDir, { recursive: true, force: true });
  }
  if (fs.existsSync(testMetadataDir)) {
    fs.rmSync(testMetadataDir, { recursive: true, force: true });
  }
});

// Helper to create a test image
async function createTestImage(filename: string): Promise<string> {
  const imagePath = path.join(testImageDir, filename);
  await sharp({
    create: {
      width: 200,
      height: 150,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg({ quality: 90 })
    .toFile(imagePath);

  return imagePath;
}

describe("extractImageMetadata", () => {
  test("extracts image metadata correctly", async () => {
    const imagePath = await createTestImage("test.jpg");
    const relativePath = "test.jpg";
    const originalPath = imagePath;

    const metadata = await extractImageMetadata(imagePath, relativePath, originalPath);

    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(150);
    expect(metadata.format).toBe("jpeg");
    expect(metadata.fileSize).toBeGreaterThan(0);
    expect(metadata.createdAt).toBeDefined();
  }, 10000);

  test("handles missing original file", async () => {
    const imagePath = await createTestImage("test.jpg");
    const relativePath = "test.jpg";
    const originalPath = "nonexistent.jpg";

    const metadata = await extractImageMetadata(imagePath, relativePath, originalPath);

    expect(metadata.width).toBe(200);
    expect(metadata.originalSize).toBe(metadata.fileSize);
  }, 10000);
});

describe("saveMetadata and loadMetadata", () => {
  test("saves and loads metadata", async () => {
    const imagePath = await createTestImage("test.jpg");
    const relativePath = "test.jpg";
    const originalPath = imagePath;

    const metadataToSave: Partial<ImageMetadata> = {
      title: "Test Image",
      altText: "A test image",
      description: "This is a test",
      keywords: ["test", "image"],
    };

    const saved = await saveMetadata(imagePath, relativePath, originalPath, metadataToSave);
    expect(saved.title).toBe("Test Image");
    expect(saved.altText).toBe("A test image");

    const loaded = loadMetadata(imagePath, relativePath, originalPath);
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe("Test Image");
    expect(loaded?.altText).toBe("A test image");
  }, 10000);

  test("merges with existing metadata", async () => {
    const imagePath = await createTestImage("test.jpg");
    const relativePath = "test.jpg";
    const originalPath = imagePath;

    await saveMetadata(imagePath, relativePath, originalPath, { title: "Original Title" });
    const updated = await saveMetadata(imagePath, relativePath, originalPath, { altText: "New Alt" });

    expect(updated.title).toBe("Original Title");
    expect(updated.altText).toBe("New Alt");
  }, 10000);

  test("returns null for non-existent metadata", () => {
    const result = loadMetadata("nonexistent.jpg", "nonexistent.jpg", "nonexistent.jpg");
    expect(result).toBeNull();
  });
});

describe("generateSEOFilename", () => {
  test("generates SEO-friendly filename from title", () => {
    const result = generateSEOFilename("original", "My Great Image Title");
    expect(result).toBe("my-great-image-title");
  });

  test("generates SEO-friendly filename from alt text", () => {
    const result = generateSEOFilename("original", undefined, "Beautiful Sunset Photo");
    expect(result).toBe("beautiful-sunset-photo");
  });

  test("falls back to base name", () => {
    const result = generateSEOFilename("original-name");
    expect(result).toBe("original-name");
  });

  test("removes special characters", () => {
    const result = generateSEOFilename("original", "Image @#$% Title!");
    expect(result).toBe("image-title");
  });

  test("handles multiple spaces", () => {
    const result = generateSEOFilename("original", "Image    With    Spaces");
    expect(result).toBe("image-with-spaces");
  });

  test("removes leading/trailing hyphens", () => {
    const result = generateSEOFilename("original", "-Leading and Trailing-");
    expect(result).toBe("leading-and-trailing");
  });

  test("limits length to 100 characters", () => {
    const longTitle = "a".repeat(150);
    const result = generateSEOFilename("original", longTitle);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe("renameImage", () => {
  test("renames image file and updates metadata", async () => {
    const imagePath = await createTestImage("old-name.jpg");
    const relativePath = "old-name.jpg";

    // Save metadata first
    await saveMetadata(imagePath, relativePath, imagePath, { title: "Test" });

    const newPath = await renameImage(imagePath, "new-name.jpg", relativePath);

    expect(fs.existsSync(newPath)).toBe(true);
    expect(fs.existsSync(imagePath)).toBe(false);

    const metadata = loadMetadata(newPath, "new-name.jpg", newPath);
    expect(metadata?.filename).toBe("new-name.jpg");
  }, 10000);

  test("throws error if file already exists", async () => {
    const imagePath1 = await createTestImage("existing.jpg");
    const imagePath2 = await createTestImage("test.jpg");
    const relativePath = "test.jpg";

    await expect(
      renameImage(imagePath2, "existing.jpg", relativePath)
    ).rejects.toThrow();
  }, 10000);
});

describe("getAllImages", () => {
  test("finds all images in directory", async () => {
    await createTestImage("image1.jpg");
    await createTestImage("image2.png");

    // Create a subdirectory image
    const subDir = path.join(testImageDir, "subdir");
    fs.mkdirSync(subDir, { recursive: true });
    await createTestImage("subdir/image3.jpg");

    const images = getAllImages(testImageDir);

    expect(images.length).toBeGreaterThanOrEqual(2);
    expect(images.some((img) => img.path.includes("image1.jpg"))).toBe(true);
    expect(images.some((img) => img.path.includes("image2.png"))).toBe(true);
  }, 10000);

  test("returns empty array for non-existent directory", () => {
    const images = getAllImages("nonexistent-directory");
    expect(images).toEqual([]);
  });

  test("ignores non-image files", async () => {
    // Create a text file
    fs.writeFileSync(path.join(testImageDir, "not-an-image.txt"), "test");

    const images = getAllImages(testImageDir);
    expect(images.every((img) => img.path.endsWith(".txt") === false)).toBe(true);
  });
});

