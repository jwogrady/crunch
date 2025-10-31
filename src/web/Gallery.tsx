import { useState, useEffect } from "react";
import { formatBytes } from "./utils/helpers";

interface ImageMetadata {
  filename: string;
  path: string;
  relativePath: string;
  originalPath: string;
  fileSize: number;
  originalSize: number;
  format: string;
  width: number;
  height: number;
  title?: string;
  altText?: string;
  description?: string;
  caption?: string;
  keywords?: string[];
  exif?: Record<string, any>;
  colorSpace?: string;
  hasAlpha?: boolean;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
  downloadUrl: string;
}

interface ImagesResponse {
  success: boolean;
  images?: ImageMetadata[];
  count?: number;
  error?: string;
}

// formatBytes is now imported from utils/helpers

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
  multiline = false,
  rows = 3
}: { 
  label: string; 
  type?: string; 
  value: string | number | string[] | undefined; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) => {
  const Component = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <Component
        type={type}
        value={typeof value === "string" ? value : typeof value === "number" ? value : Array.isArray(value) ? value.join(", ") : ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      />
      {Array.isArray(value) && (
        <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
      )}
    </div>
  );
};

export default function Gallery() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<Partial<ImageMetadata>>({});
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [useSEO, setUseSEO] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/images");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error loading images:", res.status, errorText);
        return;
      }
      const data: ImagesResponse = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      } else {
        console.error("Error loading images:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectImage = async (image: ImageMetadata) => {
    setSelectedImage(image);
    setEditingMetadata({
      title: image.title || "",
      altText: image.altText || "",
      description: image.description || "",
      caption: image.caption || "",
      keywords: image.keywords || [],
    });
    setNewFilename(image.filename);
    
    // Load full metadata
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(image.relativePath)}/metadata`);
      if (!res.ok) {
        // If response is not OK, try to get error message
        const errorText = await res.text();
        console.error("Error loading metadata:", res.status, errorText);
        return;
      }
      const data = await res.json();
      if (data.success && data.metadata) {
        setSelectedImage(data.metadata);
      } else {
        console.error("Error loading metadata:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  };

  const saveMetadata = async () => {
    if (!selectedImage) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(selectedImage.relativePath)}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMetadata),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error saving metadata:", res.status, errorText);
        alert(`Error saving metadata: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        await loadImages();
        setSelectedImage(data.metadata);
        alert("Metadata saved successfully!");
      } else {
        alert(data.error || "Error saving metadata");
      }
    } catch (error) {
      console.error("Error saving metadata:", error);
      alert("Error saving metadata");
    } finally {
      setSaving(false);
    }
  };

  const renameImage = async () => {
    if (!selectedImage || !newFilename) return;
    
    setRenaming(true);
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(selectedImage.relativePath)}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newFilename, useSEO }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error renaming image:", res.status, errorText);
        alert(`Error renaming image: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        await loadImages();
        alert("Image renamed successfully!");
        setSelectedImage(null);
      } else {
        alert(data.error || "Error renaming image");
      }
    } catch (error) {
      console.error("Error renaming image:", error);
      alert("Error renaming image");
    } finally {
      setRenaming(false);
    }
  };

  const exportWordPress = () => {
    window.location.href = "/api/images/export/wordpress";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Gallery & Management</h1>
            <p className="text-gray-600 mt-1">Preview, edit metadata, and prepare images for WordPress</p>
          </div>
          <Button onClick={exportWordPress} type="primary">
            Export for WordPress
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No images found. Upload and optimize some images first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Grid */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => selectImage(image)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage?.relativePath === image.relativePath
                          ? "border-green-500 ring-2 ring-green-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={image.previewUrl}
                          alt={image.altText || image.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            // Replace broken image with placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const placeholder = target.parentElement?.querySelector(".image-placeholder");
                            if (placeholder) {
                              (placeholder as HTMLElement).style.display = "flex";
                            }
                          }}
                        />
                        <div className="image-placeholder absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-xs" style={{ display: "none" }}>
                          No Preview
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium text-gray-900 truncate">{image.filename}</p>
                        <p className="text-xs text-gray-500">{image.width} × {image.height}</p>
                        {image.title && (
                          <p className="text-xs text-gray-600 truncate mt-1">{image.title}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metadata Editor */}
            <div className="lg:col-span-1">
              {selectedImage ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 sticky top-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Metadata</h2>
                    
                    {/* Image Preview */}
                    <div className="mb-4">
                      <img
                        src={selectedImage.previewUrl}
                        alt={selectedImage.altText || selectedImage.filename}
                        className="w-full rounded-lg border border-gray-200"
                        onError={(e) => {
                          // Replace broken image with placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const placeholder = target.parentElement?.querySelector(".image-placeholder-large");
                          if (placeholder) {
                            (placeholder as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                      <div className="image-placeholder-large bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-sm min-h-[200px]" style={{ display: "none" }}>
                        Preview unavailable
                      </div>
                    </div>

                    {/* Technical Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dimensions:</span>
                        <span className="font-medium">{selectedImage.width} × {selectedImage.height}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{formatBytes(selectedImage.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Format:</span>
                        <span className="font-medium">{selectedImage.format.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Size:</span>
                        <span className="font-medium">{formatBytes(selectedImage.originalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Savings:</span>
                        <span className="font-medium text-green-600">
                          {formatBytes(selectedImage.originalSize - selectedImage.fileSize)} (
                          {(((selectedImage.originalSize - selectedImage.fileSize) / selectedImage.originalSize) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* SEO Fields */}
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        value={editingMetadata.title || ""}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, title: e.target.value })}
                        placeholder="Image title"
                      />

                      <Input
                        label="Alt Text"
                        value={editingMetadata.altText || ""}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, altText: e.target.value })}
                        placeholder="Alternative text for accessibility"
                      />

                      <Input
                        label="Caption"
                        value={editingMetadata.caption || ""}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, caption: e.target.value })}
                        placeholder="Image caption"
                      />

                      <Input
                        label="Description"
                        multiline
                        rows={3}
                        value={editingMetadata.description || ""}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, description: e.target.value })}
                        placeholder="Detailed description"
                      />

                      <Input
                        label="Keywords (comma-separated)"
                        value={Array.isArray(editingMetadata.keywords) ? editingMetadata.keywords.join(", ") : ""}
                        onChange={(e) => {
                          const keywords = e.target.value.split(",").map(k => k.trim()).filter(k => k);
                          setEditingMetadata({ ...editingMetadata, keywords });
                        }}
                        placeholder="keyword1, keyword2, keyword3"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filename</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newFilename}
                            onChange={(e) => setNewFilename(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="useSEO"
                              checked={useSEO}
                              onChange={(e) => setUseSEO(e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor="useSEO" className="text-sm text-gray-700">
                              Generate SEO-friendly filename
                            </label>
                          </div>
                          <Button
                            onClick={renameImage}
                            loading={renaming}
                            size="small"
                            type="default"
                            className="w-full"
                          >
                            Rename File
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={saveMetadata}
                        loading={saving}
                        type="primary"
                        className="w-full"
                      >
                        Save Metadata
                      </Button>

                      <Button
                        onClick={() => window.location.href = selectedImage.downloadUrl}
                        type="default"
                        className="w-full"
                      >
                        Download Image
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                  <p>Select an image to view and edit metadata</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

