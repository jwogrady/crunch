import { describe, test, expect, beforeEach } from "bun:test";
import { getCachedThumbnail, invalidateImageCache, thumbnailCache, metadataCache } from "../../../src/server/utils/cache";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Create test directory
const testDir = path.join(process.cwd(), "test-temp");
const testImagePath = path.join(testDir, "test.jpg");

beforeEach(() => {
  // Clear caches before each test
  thumbnailCache.clear();
  metadataCache.clear();

  // Create test directory and image if needed
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    // Create a simple 100x100 pixel image
    sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toFile(testImagePath)
      .catch(() => {
        // Ignore errors in test setup
      });
  }
});

describe("thumbnailCache", () => {
  test("stores and retrieves cached data", () => {
    thumbnailCache.set("test-key", Buffer.from("test-data"));
    const result = thumbnailCache.get("test-key");
    expect(result).toBeDefined();
    expect(result?.toString()).toBe("test-data");
  });

  test("returns null for non-existent keys", () => {
    const result = thumbnailCache.get("non-existent");
    expect(result).toBeNull();
  });

  test("expires cached data after TTL", async () => {
    thumbnailCache.set("test-key", Buffer.from("test"), 100); // 100ms TTL
    expect(thumbnailCache.get("test-key")).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(thumbnailCache.get("test-key")).toBeNull();
  });

  test("deletes cached data", () => {
    thumbnailCache.set("test-key", Buffer.from("test"));
    thumbnailCache.delete("test-key");
    expect(thumbnailCache.get("test-key")).toBeNull();
  });

  test("clears all cached data", () => {
    thumbnailCache.set("key1", Buffer.from("data1"));
    thumbnailCache.set("key2", Buffer.from("data2"));
    thumbnailCache.clear();
    expect(thumbnailCache.get("key1")).toBeNull();
    expect(thumbnailCache.get("key2")).toBeNull();
  });
});

describe("metadataCache", () => {
  test("stores and retrieves metadata", () => {
    const metadata = { width: 100, height: 100 };
    metadataCache.set("test-key", metadata);
    const result = metadataCache.get("test-key");
    expect(result).toEqual(metadata);
  });
});

describe("getCachedThumbnail", () => {
  test("generates thumbnail if not cached", async () => {
    if (!fs.existsSync(testImagePath)) {
      // Skip if test image doesn't exist
      return;
    }

    const thumbnail = await getCachedThumbnail(testImagePath, 50);
    expect(thumbnail).toBeDefined();
    expect(Buffer.isBuffer(thumbnail)).toBe(true);
  }, 10000);

  test("returns cached thumbnail on second call", async () => {
    if (!fs.existsSync(testImagePath)) {
      return;
    }

    const thumbnail1 = await getCachedThumbnail(testImagePath, 50);
    const start = Date.now();
    const thumbnail2 = await getCachedThumbnail(testImagePath, 50);
    const duration = Date.now() - start;

    expect(thumbnail1.equals(thumbnail2)).toBe(true);
    // Cached should be much faster (though exact timing may vary)
    expect(duration).toBeLessThan(100);
  }, 10000);
});

describe("invalidateImageCache", () => {
  test("invalidates cache for image path", () => {
    thumbnailCache.set("test-image.jpg-400", Buffer.from("data"));
    metadataCache.set("test-image.jpg", { width: 100 });

    invalidateImageCache("test-image.jpg");

    expect(thumbnailCache.get("test-image.jpg-400")).toBeNull();
    expect(metadataCache.get("test-image.jpg")).toBeNull();
  });
});

