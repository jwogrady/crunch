import sharp from "sharp";
import fs from "fs";
import path from "path";

export interface ImageMetadata {
  // File info
  filename: string;
  path: string;
  relativePath: string;
  originalPath: string;
  fileSize: number;
  originalSize: number;
  format: string;
  
  // Image dimensions
  width: number;
  height: number;
  
  // SEO fields (WordPress ready)
  title?: string;
  altText?: string;
  description?: string;
  caption?: string;
  keywords?: string[];
  
  // Technical metadata
  exif?: Record<string, any>;
  colorSpace?: string;
  hasAlpha?: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

const METADATA_DIR = ".metadata";

/**
 * Ensure metadata directory exists
 */
function ensureMetadataDir(): void {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
}

/**
 * Get metadata file path for an image
 */
function getMetadataPath(imagePath: string): string {
  ensureMetadataDir();
  const hash = Buffer.from(imagePath).toString("base64").replace(/[/+=]/g, "");
  return path.join(METADATA_DIR, `${hash}.json`);
}

/**
 * Extract technical metadata from image using Sharp
 */
export async function extractImageMetadata(imagePath: string, relativePath: string, originalPath: string): Promise<Partial<ImageMetadata>> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const stats = fs.statSync(imagePath);
    const originalStats = fs.existsSync(originalPath) ? fs.statSync(originalPath) : null;

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "unknown",
      colorSpace: metadata.space,
      hasAlpha: metadata.hasAlpha || false,
      fileSize: stats.size,
      originalSize: originalStats?.size || stats.size,
      exif: metadata.exif ? parseExif(metadata.exif) : undefined,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    // Import logger only when needed to avoid circular dependencies
    const { logger } = await import("./utils/logger");
    logger.error(`Error extracting metadata for ${imagePath}:`, error);
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Parse EXIF data into a readable format
 */
function parseExif(exif: Buffer): Record<string, any> {
  try {
    // Sharp doesn't parse EXIF directly, but we can note it exists
    // For full EXIF parsing, we'd need exif-reader or similar
    return {
      hasExif: true,
      rawSize: exif.length,
    };
  } catch {
    return {};
  }
}

/**
 * Load metadata for an image
 */
export function loadMetadata(imagePath: string, relativePath: string, originalPath: string): ImageMetadata | null {
  const metadataPath = getMetadataPath(imagePath);
  
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    return data as ImageMetadata;
  } catch {
    return null;
  }
}

/**
 * Save metadata for an image
 */
export async function saveMetadata(
  imagePath: string,
  relativePath: string,
  originalPath: string,
  metadata: Partial<ImageMetadata>
): Promise<ImageMetadata> {
  ensureMetadataDir();
  
  // Load existing metadata or create new
  let existing = loadMetadata(imagePath, relativePath, originalPath);
  
  // Extract technical metadata if not already present
  if (!existing) {
    const technical = await extractImageMetadata(imagePath, relativePath, originalPath);
    existing = {
      filename: path.basename(imagePath),
      path: imagePath,
      relativePath,
      originalPath,
      width: 0,
      height: 0,
      format: "unknown",
      fileSize: 0,
      originalSize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...technical,
    };
  }

  // Merge with new metadata
  const updated: ImageMetadata = {
    ...existing,
    ...metadata,
    updatedAt: new Date().toISOString(),
    filename: metadata.filename || existing.filename,
    path: imagePath,
    relativePath,
  };

  // Save to file
  const metadataPath = getMetadataPath(imagePath);
  fs.writeFileSync(metadataPath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * Generate SEO-friendly filename
 */
export function generateSEOFilename(baseName: string, title?: string, altText?: string): string {
  // Use title or alt text if provided, otherwise use base name
  const source = title || altText || baseName;
  
  // Convert to SEO-friendly format:
  // - Lowercase
  // - Replace spaces and special chars with hyphens
  // - Remove multiple consecutive hyphens
  // - Remove leading/trailing hyphens
  let seoName = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  // Limit length
  if (seoName.length > 100) {
    seoName = seoName.substring(0, 100);
  }

  return seoName || baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

/**
 * Rename image file and update metadata
 */
export async function renameImage(
  oldPath: string,
  newFilename: string,
  relativePath: string
): Promise<string> {
  const dir = path.dirname(oldPath);
  const newPath = path.join(dir, newFilename);
  
  if (fs.existsSync(newPath)) {
    throw new Error("File with that name already exists");
  }

  // Rename file
  fs.renameSync(oldPath, newPath);

  // Update metadata path
  const oldMetadataPath = getMetadataPath(oldPath);
  if (fs.existsSync(oldMetadataPath)) {
    const newMetadataPath = getMetadataPath(newPath);
    const metadata = JSON.parse(fs.readFileSync(oldMetadataPath, "utf-8"));
    metadata.filename = newFilename;
    metadata.path = newPath;
    metadata.relativePath = path.join(path.dirname(relativePath), newFilename).replace(/\\/g, "/");
    
    fs.writeFileSync(newMetadataPath, JSON.stringify(metadata, null, 2));
    fs.unlinkSync(oldMetadataPath);
  }

  return newPath;
}

/**
 * Get all images from the optimized directory
 */
export function getAllImages(baseDir: string = "optimized"): Array<{ path: string; relativePath: string; originalPath: string }> {
  const images: Array<{ path: string; relativePath: string; originalPath: string }> = [];

  function scanDirectory(dir: string, relativeBase: string = "") {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.join(relativeBase, entry).replace(/\\/g, "/");
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry)) {
        // Map to original path
        const originalPath = fullPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(fullPath) || ".jpg");
        images.push({
          path: fullPath,
          relativePath,
          originalPath,
        });
      }
    }
  }

  scanDirectory(baseDir);
  return images;
}

