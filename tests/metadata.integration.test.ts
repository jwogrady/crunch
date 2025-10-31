import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  extractImageMetadata,
  saveMetadata,
  loadMetadata,
  getAllImages,
  generateSEOFilename,
  ImageMetadata,
} from "../src/metadata";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const testDir = path.join(process.cwd(), "test-integration");
const metadataDir = path.join(process.cwd(), ".metadata-test");

beforeEach(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  if (fs.existsSync(metadataDir)) {
    fs.rmSync(metadataDir, { recursive: true, force: true });
  }
});

describe("Metadata Integration", () => {
  test("full metadata workflow", async () => {
    // Create test image
    const imagePath = path.join(testDir, "test.jpg");
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

    // Extract metadata
    const extracted = await extractImageMetadata(imagePath, "test.jpg", imagePath);
    expect(extracted.width).toBe(200);

    // Save metadata
    const saved = await saveMetadata(imagePath, "test.jpg", imagePath, {
      title: "Integration Test",
      altText: "Test image",
      keywords: ["test", "integration"],
    });
    expect(saved.title).toBe("Integration Test");

    // Load metadata
    const loaded = loadMetadata(imagePath, "test.jpg", imagePath);
    expect(loaded?.title).toBe("Integration Test");
    expect(loaded?.keywords).toEqual(["test", "integration"]);
  }, 10000);
});

describe("SEO Filename Generation Integration", () => {
  test("generates SEO filename from metadata", () => {
    const filename = generateSEOFilename(
      "original-name",
      "My Great Image Title",
      "Alternative Text Description"
    );
    expect(filename).toBe("my-great-image-title");
    expect(filename).not.toContain(" ");
    expect(filename).not.toContain("original-name");
  });

  test("handles edge cases in SEO generation", () => {
    expect(generateSEOFilename("", "")).toBeDefined();
    expect(generateSEOFilename("test", "")).toBeDefined();
    expect(generateSEOFilename("", "Title")).toBeDefined();
  });
});

