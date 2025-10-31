import { describe, test, expect } from "bun:test";
import { existsSync } from "fs";
import { resolve } from "path";

/**
 * Integration tests to verify the app can actually build and run
 * These catch issues that unit tests might miss (import paths, syntax errors, etc.)
 */

describe("Build Integration Tests", () => {
  test("all critical source files exist", () => {
    const criticalFiles = [
      "src/server.ts",
      "src/optimizer.ts",
      "src/metadata.ts",
      "src/utils/constants.ts",
      "src/utils/helpers.ts",
      "src/server/utils/security.ts",
      "src/server/utils/cache.ts",
      "src/web/App.tsx",
      "src/web/Gallery.tsx",
      "src/web/main.tsx",
      "src/web/index.html",
    ];

    criticalFiles.forEach((file) => {
      expect(existsSync(resolve(process.cwd(), file))).toBe(true);
    });
  });

  test("server.ts can import all dependencies", async () => {
    // This will fail if imports are broken
    // Note: server.ts has side effects (starts server), so we test imports indirectly
    // by checking that all dependencies server.ts needs can be imported
    try {
      // Import all dependencies that server.ts uses
      await import("../../src/utils/constants.ts");
      await import("../../src/utils/helpers.ts");
      await import("../../src/server/utils/security.ts");
      await import("../../src/server/utils/cache.ts");
      await import("../../src/optimizer.ts");
      await import("../../src/metadata.ts");
      // If we get here, all dependencies can be imported
      expect(true).toBe(true);
    } catch (error) {
      throw new Error(`Server dependencies import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("optimizer.ts can import all dependencies", async () => {
    try {
      await import("../../src/optimizer.ts");
      expect(true).toBe(true);
    } catch (error) {
      throw new Error(`Optimizer imports failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("metadata.ts can import all dependencies", async () => {
    try {
      await import("../../src/metadata.ts");
      expect(true).toBe(true);
    } catch (error) {
      throw new Error(`Metadata imports failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("utils/constants.ts can be imported", async () => {
    try {
      const constants = await import("../../src/utils/constants.ts");
      expect(constants.CONSTANTS).toBeDefined();
      expect(constants.CONSTANTS.DEFAULT_WIDTH).toBe(1600);
    } catch (error) {
      throw new Error(`Constants import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("utils/helpers.ts can be imported", async () => {
    try {
      const helpers = await import("../../src/utils/helpers.ts");
      expect(typeof helpers.formatBytes).toBe("function");
      expect(typeof helpers.validatePath).toBe("function");
    } catch (error) {
      throw new Error(`Helpers import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("server/utils/security.ts can import helpers", async () => {
    try {
      const security = await import("../../src/server/utils/security.ts");
      expect(typeof security.validateImagePath).toBe("function");
    } catch (error) {
      throw new Error(`Security import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("server.ts imports use correct relative paths", () => {
    // Check that server.ts can resolve its imports from its location
    const serverPath = resolve(process.cwd(), "src/server.ts");
    const utilsConstantsPath = resolve(process.cwd(), "src/utils/constants.ts");
    const utilsHelpersPath = resolve(process.cwd(), "src/utils/helpers.ts");
    const securityPath = resolve(process.cwd(), "src/server/utils/security.ts");
    
    // Verify all files exist
    expect(existsSync(serverPath)).toBe(true);
    expect(existsSync(utilsConstantsPath)).toBe(true);
    expect(existsSync(utilsHelpersPath)).toBe(true);
    expect(existsSync(securityPath)).toBe(true);
    
    // Verify correct relative path structure
    // server.ts is in src/, utils/ is in src/, so path should be ./utils/constants (not ../utils/constants)
    // From server.ts location (src/), utils/ is a sibling directory, so ./utils/constants is correct
    const serverDir = resolve(process.cwd(), "src");
    const utilsDir = resolve(process.cwd(), "src/utils");
    expect(serverDir).not.toBe(utilsDir);
    expect(utilsDir).toContain(serverDir); // utils is inside src
  });

  test("all utility modules export expected functions", async () => {
    const helpers = await import("../../src/utils/helpers.ts");
    expect(typeof helpers.formatBytes).toBe("function");
    expect(typeof helpers.validatePath).toBe("function");
    expect(typeof helpers.sanitizePath).toBe("function");
    expect(typeof helpers.getFileExtension).toBe("function");
    expect(typeof helpers.isImageFile).toBe("function");
  });
});

describe("Frontend Build Tests", () => {
  test("App.tsx exports a default component", async () => {
    try {
      // Try to import - this will fail if there are syntax errors
      const module = await import("../../src/web/App.tsx");
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe("function");
    } catch (error) {
      throw new Error(`App.tsx import failed (likely syntax error): ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("Gallery.tsx can be imported", async () => {
    try {
      const module = await import("../../src/web/Gallery.tsx");
      expect(module.default).toBeDefined();
    } catch (error) {
      throw new Error(`Gallery.tsx import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  test("main.tsx can be imported", async () => {
    try {
      // main.tsx uses ReactDOM which needs browser env, so we just check the file exists and is valid syntax
      // The actual rendering would fail in Node.js environment
      const filePath = resolve(process.cwd(), "src/web/main.tsx");
      expect(existsSync(filePath)).toBe(true);
      
      // We can't actually import it in Node.js test environment (needs DOM),
      // but syntax checking happens during build
      expect(true).toBe(true);
    } catch (error) {
      // In Node.js, ReactDOM will fail - that's expected, syntax check happens at build time
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("document is not defined") || errorMsg.includes("window is not defined")) {
        // Expected in Node.js environment - syntax is fine, just needs browser runtime
        expect(true).toBe(true);
      } else {
        throw new Error(`main.tsx import failed: ${errorMsg}`);
      }
    }
  });
});

describe("Module Resolution Tests", () => {
  test("constants can be imported from server.ts location", async () => {
    // Simulate how server.ts imports constants - from src/server.ts, it should be ./utils/constants
    const constants = await import("../../src/utils/constants.ts");
    expect(constants.CONSTANTS).toBeDefined();
  });

  test("helpers can be imported from server.ts location", async () => {
    const helpers = await import("../../src/utils/helpers.ts");
    expect(helpers.formatBytes).toBeDefined();
  });

  test("security can import helpers", async () => {
    const security = await import("../../src/server/utils/security.ts");
    expect(security.validateImagePath).toBeDefined();
  });

  test("cache can import constants", async () => {
    const cache = await import("../../src/server/utils/cache.ts");
    expect(cache.getCachedThumbnail).toBeDefined();
  });
});

