import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Enhanced logging for debugging (only in development)
if (import.meta.env.DEV) {
  console.log("🖼️ Image Optimizer - Starting app...");
  console.log("📍 Environment:", {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
}

// Global error handler to catch unhandled errors
window.addEventListener("error", (event) => {
  // Always log errors, but only show debug info in dev
  if (import.meta.env.DEV) {
    console.error("🔴 Global error:", event.error);
  } else {
    console.error("Application error occurred");
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (import.meta.env.DEV) {
    console.error("🔴 Unhandled promise rejection:", event.reason);
  } else {
    console.error("Unhandled promise rejection");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  console.log("✅ App rendered successfully");
}

