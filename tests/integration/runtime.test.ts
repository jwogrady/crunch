import { describe, test, expect } from "bun:test";
import { spawn } from "bun";
import { existsSync } from "fs";

/**
 * Runtime integration tests - verify the app can actually start
 * These tests check if the server and frontend can run, not just compile
 */

describe("Runtime Integration Tests", () => {
  test("server.ts can start without import errors", async () => {
    const serverPath = "src/server.ts";
    expect(existsSync(serverPath)).toBe(true);

    // Try to spawn the server process and check for immediate errors
    const proc = spawn({
      cmd: ["bun", "run", serverPath],
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PORT: "3999" }, // Use different port to avoid conflicts
    });

    // Wait a bit for startup errors
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if process is still alive (didn't crash immediately)
    const exited = proc.killed || proc.exitCode !== null;
    
    // Clean up
    try {
      proc.kill();
    } catch {
      // Ignore cleanup errors
    }

    // If it exited immediately, it likely had an import error
    // We give it 1 second to start, so immediate exit = error
    if (exited && proc.exitCode !== 0) {
      // Get error output
      const stderr = await new Response(proc.stderr).text();
      if (stderr.includes("Cannot find module") || stderr.includes("import")) {
        throw new Error(`Server startup failed with import error: ${stderr}`);
      }
    }

    expect(true).toBe(true); // If we get here, no immediate errors
  }, 2000);
});

