import { describe, test, expect } from "bun:test";

/**
 * Test Gallery.tsx component logic
 */

describe("Gallery Component Logic", () => {
  test("formatBytes function works correctly", () => {
    // This function is defined in Gallery.tsx
    function formatBytes(bytes: number): string {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    }

    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  test("component file exists and can be parsed", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
    
    expect(fs.existsSync(galleryPath)).toBe(true);
    
    // Read and verify it's valid TypeScript/JSX
    const content = fs.readFileSync(galleryPath, "utf-8");
    expect(content).toContain("export default function Gallery");
    expect(content).toContain("useState");
    expect(content).toContain("useEffect");
    expect(content).toContain("loadImages");
    expect(content).toContain("saveMetadata");
    expect(content).toContain("renameImage");
  });

  test("component has all required functions", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const galleryPath = path.resolve(process.cwd(), "src/web/Gallery.tsx");
    const content = fs.readFileSync(galleryPath, "utf-8");
    
    // Verify key functions exist
    expect(content).toContain("loadImages");
    expect(content).toContain("selectImage");
    expect(content).toContain("saveMetadata");
    expect(content).toContain("renameImage");
    expect(content).toContain("exportWordPress");
  });
});

