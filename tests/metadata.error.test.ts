import { describe, test, expect } from "bun:test";
import { extractImageMetadata, loadMetadata, saveMetadata } from "../src/metadata";
import fs from "fs";
import path from "path";

describe("Metadata Error Handling", () => {
  test("extractImageMetadata handles non-existent file gracefully", async () => {
    const result = await extractImageMetadata(
      "nonexistent-file.jpg",
      "nonexistent.jpg",
      "nonexistent-original.jpg"
    );
    
    expect(result).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  test("loadMetadata returns null for non-existent file", () => {
    const result = loadMetadata(
      "nonexistent-file.jpg",
      "nonexistent.jpg",
      "nonexistent-original.jpg"
    );
    expect(result).toBeNull();
  });

  test("saveMetadata handles missing original path", async () => {
    // Create a temporary file for testing
    const testDir = path.join(process.cwd(), "test-temp-metadata");
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testFile = path.join(testDir, "test.jpg");
    fs.writeFileSync(testFile, "fake image data");

    try {
      const result = await saveMetadata(
        testFile,
        "test.jpg",
        "nonexistent-original.jpg",
        { title: "Test" }
      );
      
      expect(result).toBeDefined();
      expect(result.title).toBe("Test");
    } finally {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }
  }, 10000);
});

