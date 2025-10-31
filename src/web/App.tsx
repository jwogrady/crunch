import { useState } from "react";
import * as React from "react";

interface OptimizationResult {
  name: string;
  originalSize: number;
  optimizedSize: number;
  output: string;
  savings: number;
  savingsPercent: number;
  downloadUrl: string;
}

interface ApiResponse {
  success: boolean;
  results?: OptimizationResult[];
  error?: string;
}

// Use shared formatBytes from utils
import { formatBytes } from "../utils/helpers";

// Custom UI Components styled like Supabase UI
const Card = ({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  loading = false, 
  type = "default", 
  size = "medium",
  className = "",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  loading?: boolean;
  type?: "primary" | "default" | "danger";
  size?: "small" | "medium" | "large";
  className?: string;
  disabled?: boolean;
}) => {
  const baseStyles = "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const typeStyles = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  const sizeStyles = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`${baseStyles} ${typeStyles[type]} ${sizeStyles[size]} ${className}`}
      style={{ width: size === "large" && type === "primary" ? "100%" : "auto" }}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  min, 
  max 
}: { 
  label: string; 
  type?: string; 
  value: number | string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  min?: string | number;
  max?: string | number;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
    />
  </div>
);

const Alert = ({ children, variant = "danger", title }: { children: React.ReactNode; variant?: "danger" | "success"; title?: string }) => (
  <div className={`p-4 rounded-md ${
    variant === "danger" ? "bg-red-50 border border-red-200 text-red-800" : "bg-green-50 border border-green-200 text-green-800"
  }`}>
    {title && <h4 className="font-semibold mb-1">{title}</h4>}
    <div>{children}</div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<"optimize" | "gallery">("optimize");
  const [files, setFiles] = useState<FileList | null>(null);
  const [width, setWidth] = useState(1600);
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState<string>("webp");
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      setError(null);
      // Only log in development
      if (import.meta.env.DEV) {
        console.log(`📁 Files selected: ${e.target.files.length} file(s)`);
        Array.from(e.target.files).forEach((file, idx) => {
          console.log(`  ${idx + 1}. ${file.name} - ${(file.size / 1024).toFixed(2)} KB - ${file.type}`);
        });
      }
    }
  };

  const handleOptimize = async () => {
    if (!files || files.length === 0) {
      setError("Please select at least one image file");
      if (import.meta.env.DEV) {
        console.warn("⚠️ No files selected for optimization");
      }
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    if (import.meta.env.DEV) {
      console.log("🚀 Starting optimization...", {
        fileCount: files.length,
        width,
        quality,
        format,
      });
    }

    try {
      const formData = new FormData();
      Array.from(files).forEach((f: File) => {
        formData.append("files[]", f);
        if (import.meta.env.DEV) {
          console.log(`📤 Adding file: ${f.name} (${(f.size / 1024).toFixed(2)} KB)`);
        }
      });
      formData.append("width", width.toString());
      formData.append("quality", quality.toString());
      formData.append("format", format);

      if (import.meta.env.DEV) {
        console.log("📡 Sending request to /optimize");
      }

      const res = await fetch("/optimize", {
        method: "POST",
        body: formData,
      });

      if (import.meta.env.DEV) {
        console.log(`📥 Response status: ${res.status} ${res.statusText}`);
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        if (import.meta.env.DEV) {
          console.error("❌ Server error:", errorText);
        }
        setError(`Server error: ${res.status}`);
        return;
      }

      const data: ApiResponse = await res.json();

      if (import.meta.env.DEV) {
        console.log("✅ Response received:", data);
      }

      if (data.success && data.results) {
        if (import.meta.env.DEV) {
          console.log(`✨ Optimization complete! ${data.results.length} files processed`);
          data.results.forEach((result, idx) => {
            console.log(`  ${idx + 1}. ${result.name}: ${result.savingsPercent}% saved`);
          });
        }
        setResults(data.results);
      } else {
        if (import.meta.env.DEV) {
          console.error("❌ Optimization failed:", data.error);
        }
        setError(data.error || "Optimization failed");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      if (import.meta.env.DEV) {
        console.error("❌ Unexpected error:", err);
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      if (import.meta.env.DEV) {
        console.log("🏁 Optimization process completed");
      }
    }
  };

  const handleDownloadAll = () => {
    window.location.href = "/download-all";
  };

  // Lazy load Gallery component
  const Gallery = React.lazy(() => import("./Gallery"));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("optimize")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "optimize"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Optimize Images
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "gallery"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gallery & Management
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "gallery" ? (
        <React.Suspense fallback={<div className="text-center py-12">Loading gallery...</div>}>
          <Gallery />
        </React.Suspense>
      ) : (
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🖼️ Image Optimizer
                </h1>
                <p className="text-gray-600">
                  Upload images, configure settings, and download optimized results
                </p>
              </div>

          <Card>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload Images
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {files && files.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <Input
                label="Width (px)"
                type="number"
                value={width}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(Number(e.target.value))}
                placeholder="1600"
                min="1"
              />

              <Input
                label="Quality (%)"
                type="number"
                value={quality}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuality(Number(e.target.value))}
                placeholder="85"
                min="1"
                max="100"
              />

              <div>
                <label
                  htmlFor="format-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Output Format
                </label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="webp">WebP</option>
                  <option value="jpeg">JPEG</option>
                  <option value="both">Both (JPEG + WebP)</option>
                </select>
              </div>

              <Button
                onClick={handleOptimize}
                loading={loading}
                type="primary"
                size="large"
                className="w-full"
              >
                {loading ? "Optimizing..." : "Optimize Images"}
              </Button>
            </div>
          </Card>

          {error && (
            <Alert variant="danger" title="Error">
              {error}
            </Alert>
          )}

          {results.length > 0 && (
            <Card title="Optimization Results">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="font-semibold text-gray-900">
                    Total Files: {results.length}
                  </span>
                  <Button onClick={handleDownloadAll} size="small">
                    Download All as ZIP
                  </Button>
                </div>

                <div className="space-y-3">
                  {results.map((result: OptimizationResult, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-md bg-gray-50"
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">{result.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-gray-600">
                            Original: {formatBytes(result.originalSize)}
                          </span>
                          <span className="text-gray-600">
                            Optimized: {formatBytes(result.optimizedSize)}
                          </span>
                          <span
                            className={`font-semibold ${
                              result.savingsPercent > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            Saved: {formatBytes(result.savings)} ({result.savingsPercent}%)
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            window.location.href = result.downloadUrl;
                          }}
                          size="small"
                          type="default"
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
