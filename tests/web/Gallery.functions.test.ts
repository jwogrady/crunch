import { describe, test, expect } from "bun:test";

/**
 * Test Gallery.tsx component functions
 */

// Extract formatBytes for testing
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

describe("Gallery Component Functions", () => {
  describe("formatBytes", () => {
    test("formats various byte sizes", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });
  });

  describe("Component Structure", () => {
    test("Gallery.tsx exports default component", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");
      
      expect(content).toContain("export default function Gallery");
      expect(content).toContain("useState");
      expect(content).toContain("useEffect");
    });

    test("has all required state variables", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");
      
      expect(content).toContain("const [images");
      expect(content).toContain("const [loading");
      expect(content).toContain("const [selectedImage");
      expect(content).toContain("const [editingMetadata");
      expect(content).toContain("const [saving");
      expect(content).toContain("const [renaming");
    });

    test("has all required functions", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");
      
      expect(content).toContain("loadImages");
      expect(content).toContain("selectImage");
      expect(content).toContain("saveMetadata");
      expect(content).toContain("renameImage");
      expect(content).toContain("exportWordPress");
    });

    test("has proper TypeScript interfaces", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
      const content = fs.readFileSync(galleryPath, "utf-8");
      
      expect(content).toContain("interface ImageMetadata");
      expect(content).toContain("interface ImagesResponse");
    });
  });
});

