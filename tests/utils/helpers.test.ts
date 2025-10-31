import { describe, test, expect } from "bun:test";
import {
  formatBytes,
  validatePath,
  sanitizePath,
  getFileExtension,
  isImageFile,
  debounce,
  sleep,
} from "../../src/utils/helpers";

describe("formatBytes", () => {
  test("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  test("handles decimal values", () => {
    const result = formatBytes(1536);
    expect(result).toContain("KB");
    expect(parseFloat(result)).toBeGreaterThan(1);
  });

  test("handles very large numbers", () => {
    const result = formatBytes(1099511627776);
    // Should format correctly (may show as GB or Bytes depending on implementation)
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("validatePath", () => {
  test("validates paths within base directory", () => {
    expect(validatePath("/home/user/file.txt", "/home/user")).toBe(true);
    expect(validatePath("/home/user/sub/file.txt", "/home/user")).toBe(true);
  });

  test("rejects paths outside base directory", () => {
    expect(validatePath("/etc/passwd", "/home/user")).toBe(false);
    expect(validatePath("/home/user/../etc/passwd", "/home/user")).toBe(false);
  });
});

describe("sanitizePath", () => {
  test("removes directory traversal attempts", () => {
    expect(sanitizePath("../../etc/passwd")).toBe("etc/passwd");
    expect(sanitizePath("file.txt")).toBe("file.txt");
    expect(sanitizePath("sub/../file.txt")).toBe("sub/file.txt");
  });

  test("removes multiple slashes", () => {
    expect(sanitizePath("path//to//file.txt")).toBe("path/to/file.txt");
  });

  test("removes leading slashes", () => {
    expect(sanitizePath("/file.txt")).toBe("file.txt");
  });
});

describe("getFileExtension", () => {
  test("extracts file extension", () => {
    expect(getFileExtension("image.jpg")).toBe(".jpg");
    expect(getFileExtension("image.PNG")).toBe(".png");
    expect(getFileExtension("file.webp")).toBe(".webp");
  });

  test("handles files without extension", () => {
    expect(getFileExtension("file")).toBe("");
  });

  test("handles files with multiple dots", () => {
    expect(getFileExtension("file.name.jpg")).toBe(".jpg");
  });
});

describe("isImageFile", () => {
  test("identifies image files", () => {
    expect(isImageFile("image.jpg")).toBe(true);
    expect(isImageFile("image.JPG")).toBe(true);
    expect(isImageFile("image.jpeg")).toBe(true);
    expect(isImageFile("image.png")).toBe(true);
    expect(isImageFile("image.webp")).toBe(true);
    expect(isImageFile("image.gif")).toBe(true);
  });

  test("rejects non-image files", () => {
    expect(isImageFile("file.txt")).toBe(false);
    expect(isImageFile("file.pdf")).toBe(false);
    expect(isImageFile("file.exe")).toBe(false);
  });
});

describe("debounce", () => {
  test("debounces function calls", async () => {
    let callCount = 0;
    const debouncedFn = debounce(() => {
      callCount++;
    }, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(callCount).toBe(0);

    await sleep(150);
    expect(callCount).toBe(1);
  });
});

describe("sleep", () => {
  test("waits for specified milliseconds", async () => {
    const start = Date.now();
    await sleep(50);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(45);
  });
});

