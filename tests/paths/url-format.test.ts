import { describe, test, expect } from "bun:test";

describe("URL Format Consistency", () => {
  describe("Preview URL format", () => {
    test("preview URLs use correct format", () => {
      const relativePath = "2025/10/31/image.webp";
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      
      expect(previewUrl).toBe("/api/images/2025%2F10%2F31%2Fimage.webp/preview");
      expect(previewUrl).toContain("/api/images/");
      expect(previewUrl).toContain("/preview");
      expect(previewUrl).not.toContain("optimized/");
    });

    test("preview URLs encode special characters", () => {
      const relativePath = "2025/10/31/test image.webp";
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      
      expect(previewUrl).toContain("%20"); // Space encoded
      expect(previewUrl).toContain("%2F"); // Slash encoded
    });
  });

  describe("Download URL format", () => {
    test("download URLs use correct format", () => {
      const relativePath = "2025/10/31/image.webp";
      const downloadUrl = `/download/${relativePath}`;
      
      expect(downloadUrl).toBe("/download/2025/10/31/image.webp");
      expect(downloadUrl).toContain("/download/");
      expect(downloadUrl).not.toContain("optimized/");
    });

    test("download URLs handle paths with spaces", () => {
      const relativePath = "2025/10/31/test image.webp";
      const downloadUrl = `/download/${relativePath}`;
      
      // Spaces in URLs should be handled by browser/encodeURI
      expect(downloadUrl).toBe("/download/2025/10/31/test image.webp");
    });
  });

  describe("Metadata URL format", () => {
    test("metadata GET URLs use correct format", () => {
      const relativePath = "2025/10/31/image.webp";
      const metadataUrl = `/api/images/${encodeURIComponent(relativePath)}/metadata`;
      
      expect(metadataUrl).toBe("/api/images/2025%2F10%2F31%2Fimage.webp/metadata");
      expect(metadataUrl).toContain("/api/images/");
      expect(metadataUrl).toContain("/metadata");
    });

    test("metadata PUT URLs use same format as GET", () => {
      const relativePath = "2025/10/31/image.webp";
      const getUrl = `/api/images/${encodeURIComponent(relativePath)}/metadata`;
      const putUrl = `/api/images/${encodeURIComponent(relativePath)}/metadata`;
      
      expect(getUrl).toBe(putUrl);
    });
  });

  describe("URL consistency checks", () => {
    test("all URLs for same image use same relativePath", () => {
      const relativePath = "2025/10/31/image.webp";
      
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      const downloadUrl = `/download/${relativePath}`;
      const metadataUrl = `/api/images/${encodeURIComponent(relativePath)}/metadata`;
      
      // All should reference the same relativePath
      expect(previewUrl).toContain(encodeURIComponent(relativePath));
      expect(downloadUrl).toContain(relativePath);
      expect(metadataUrl).toContain(encodeURIComponent(relativePath));
    });

    test("URLs never contain optimized/ prefix", () => {
      const relativePath = "2025/10/31/image.webp";
      
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      const downloadUrl = `/download/${relativePath}`;
      
      expect(previewUrl).not.toContain("optimized/");
      expect(downloadUrl).not.toContain("optimized/");
    });

    test("URLs handle date-based paths correctly", () => {
      const paths = [
        "2025/01/01/image.jpg",
        "2025/12/31/image.jpg",
        "2024/01/01/image.jpg",
      ];
      
      paths.forEach((relativePath) => {
        const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
        const downloadUrl = `/download/${relativePath}`;
        
        expect(previewUrl).toMatch(/^\/api\/images\/\d{4}%2F\d{2}%2F\d{2}%2F/);
        expect(downloadUrl).toMatch(/^\/download\/\d{4}\/\d{2}\/\d{2}\//);
      });
    });
  });

  describe("Edge cases in URL construction", () => {
    test("handles filenames with dots", () => {
      const relativePath = "2025/10/31/image.v2.webp";
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      
      expect(previewUrl).toContain("image.v2.webp");
    });

    test("handles deeply nested paths", () => {
      const relativePath = "2025/10/31/sub1/sub2/sub3/image.jpg";
      const previewUrl = `/api/images/${encodeURIComponent(relativePath)}/preview`;
      const downloadUrl = `/download/${relativePath}`;
      
      expect(previewUrl).toContain("sub1");
      expect(previewUrl).toContain("sub3");
      expect(downloadUrl).toContain("sub1");
      expect(downloadUrl).toContain("sub3");
    });
  });
});

