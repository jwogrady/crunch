import { describe, test, expect } from "bun:test";
import React from "react";

// Test UI components directly
describe("UI Components", () => {
  test("Button component can be imported", async () => {
    const { Button } = await import("../../src/web/components/ui");
    expect(typeof Button).toBe("function");
  });

  test("Input component can be imported", async () => {
    const { Input } = await import("../../src/web/components/ui");
    expect(typeof Input).toBe("function");
  });

  test("Card component can be imported", async () => {
    const { Card } = await import("../../src/web/components/ui");
    expect(typeof Card).toBe("function");
  });

  test("Alert component can be imported", async () => {
    const { Alert } = await import("../../src/web/components/ui");
    expect(typeof Alert).toBe("function");
  });

  test("Toast component can be imported", async () => {
    const { Toast } = await import("../../src/web/components/ui");
    expect(typeof Toast).toBe("function");
  });
});

