import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { optimizeImage, OptimizationOptions } from "./optimizer";
import {
  getAllImages,
  loadMetadata,
  saveMetadata,
  renameImage,
  generateSEOFilename,
  ImageMetadata,
} from "./metadata";
import { validateImagePath } from "./server/utils/security";
import { getCachedThumbnail, invalidateImageCache } from "./server/utils/cache";
import { CONSTANTS, validateFileType, validateFileSize } from "./utils/constants";
import { formatBytes, isImageFile } from "./utils/helpers";
import { logger } from "./utils/logger";
import { config } from "./utils/config";

const app = new Elysia();

// Enable CORS for frontend
app.use(cors());

/**
 * Sanitize error message for client (hide internal details in production)
 */
function sanitizeError(error: unknown): string {
  const isDev = config.nodeEnv === "development";
  if (error instanceof Error) {
    // In production, only show generic message
    if (!isDev) {
      logger.error("Internal error:", error);
      return "An unexpected error occurred. Please try again.";
    }
    return error.message;
  }
  return "An unexpected error occurred";
}

// Image optimization endpoint with improved error handling
app.post("/optimize", async (context) => {
  try {
    const formData = await context.request.formData();
    
    const width = Number(formData.get("width")) || CONSTANTS.DEFAULT_WIDTH;
    const quality = Number(formData.get("quality")) || CONSTANTS.DEFAULT_QUALITY;
    const format = (formData.get("format") as string) || CONSTANTS.DEFAULT_FORMAT;
    const files = formData.getAll("files[]") as File[];

    if (!files || files.length === 0) {
      logger.warn("Optimize request with no files");
      return {
        success: false,
        error: "No files provided. Please select at least one image file.",
      };
    }

    // Validate file count limit
    if (files.length > config.maxFilesPerRequest) {
      logger.warn(`Too many files requested: ${files.length} (max: ${config.maxFilesPerRequest})`);
      return {
        success: false,
        error: `Too many files. Maximum ${config.maxFilesPerRequest} files per request.`,
      };
    }

    // Validate files
    const validationErrors: string[] = [];
    for (const file of files) {
      if (!validateFileType(file.name)) {
        validationErrors.push(`${file.name}: Invalid file type. Only images are supported.`);
        continue;
      }
      
      if (!validateFileSize(file.size, CONSTANTS.MAX_FILE_SIZE)) {
        validationErrors.push(`${file.name}: File too large. Maximum size is ${formatBytes(CONSTANTS.MAX_FILE_SIZE)}.`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(" "),
      };
    }

    const options: OptimizationOptions = {
      width: Math.max(1, Math.min(width, 10000)), // Clamp between 1-10000
      quality: Math.max(1, Math.min(quality, 100)), // Clamp between 1-100
      format: format as "jpeg" | "webp" | "both",
    };

    const allResults = [];
    const errors: string[] = [];

    // Process files with error isolation
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const results = await optimizeImage(buffer, file.name, options);
        
        const urlResults = results.map((r) => ({
          ...r,
          downloadUrl: `/download/${r.output.replace(/\\/g, "/")}`,
        }));
        
        allResults.push(...urlResults);
      } catch (error) {
        const errorMsg = sanitizeError(error);
        errors.push(`${file.name}: ${errorMsg}`);
        logger.error(`Error processing ${file.name}:`, error);
      }
    }

    if (allResults.length === 0) {
      return {
        success: false,
        error: errors.length > 0 ? errors.join(" ") : "Failed to process all files",
      };
    }

    return {
      success: true,
      results: allResults,
      warnings: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error("Optimization error:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

// Download endpoint with improved security
app.get("/download/*", (context) => {
  try {
    const relativePath = (context.params["*"] as string) || "";
    
    // Validate and sanitize path
    const { valid, filePath, error } = validateImagePath(relativePath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      return new Response(error || "Invalid path", { status: 400 });
    }
    
    // Try direct path first
    let finalPath = filePath;
    
    // If direct path doesn't exist, try to find by filename (backwards compatibility)
    if (!fs.existsSync(finalPath)) {
      const fileName = path.basename(relativePath);
      const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
      if (found) {
        // Validate found path too
        const foundValidation = validateImagePath(path.relative(CONSTANTS.OPTIMIZED_DIR, found), CONSTANTS.OPTIMIZED_DIR);
        if (foundValidation.valid && foundValidation.filePath) {
          finalPath = found;
        } else {
          return new Response("File not found", { status: 404 });
        }
      } else {
        return new Response("File not found", { status: 404 });
      }
    }

    return Bun.file(finalPath);
  } catch (error) {
    logger.error("Error serving file:", error);
    return new Response(sanitizeError(error), { status: 500 });
  }
});

/**
 * Recursively get all files from a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Find a file by name recursively in a directory
 */
function findFileRecursive(dirPath: string, fileName: string): string | null {
  if (!fs.existsSync(dirPath)) {
    return null;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const found = findFileRecursive(filePath, fileName);
      if (found) return found;
    } else if (file === fileName || filePath.endsWith(fileName)) {
      return filePath;
    }
  }

  return null;
}

// Download all as ZIP
app.get("/download-all", async () => {
  const optimizedDir = "optimized";
  
  if (!fs.existsSync(optimizedDir)) {
    return new Response("No files to download", { status: 404 });
  }

  const allFiles = getAllFiles(optimizedDir);
  if (allFiles.length === 0) {
    return new Response("No files to download", { status: 404 });
  }

  return new Promise<Response>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });

    archive.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new Response(buffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="optimized-images.zip"',
          },
        })
      );
    });

    // Add all files with their relative paths preserved
    for (const filePath of allFiles) {
      const relativePath = path.relative(optimizedDir, filePath);
      archive.file(filePath, { name: relativePath });
    }

    archive.finalize();
  });

});

// ==================== Image Management API ====================

// List all images with metadata
app.get("/api/images", async () => {
  try {
    const images = getAllImages();
    const imagesWithMetadata = await Promise.all(
      images.map(async (img) => {
        let metadata = loadMetadata(img.path, img.relativePath, img.originalPath);
        
        // If no metadata exists, create it
        if (!metadata) {
          const { saveMetadata, extractImageMetadata } = await import("./metadata");
          const technical = await extractImageMetadata(img.path, img.relativePath, img.originalPath);
          metadata = await saveMetadata(img.path, img.relativePath, img.originalPath, {
            filename: path.basename(img.path),
            ...technical,
          });
        }

        return {
          ...metadata,
          previewUrl: `/api/images/${encodeURIComponent(img.relativePath)}/preview`,
          downloadUrl: `/download/${img.relativePath}`,
        };
      })
    );

    return {
      success: true,
      images: imagesWithMetadata,
      count: imagesWithMetadata.length,
    };
  } catch (error) {
    logger.error("Error listing images:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

// Get metadata for a specific image
app.get("/api/images/*/metadata", async (context) => {
  try {
    const wildcard = context.params["*"] as string;
    if (!wildcard) {
      return new Response("Image path required", { status: 400 });
    }
    
    const decodedPath = decodeURIComponent(wildcard);
    logger.debug(`Metadata request - path: ${decodedPath}`);
    const fullPath = path.join("optimized", decodedPath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const optimizedDir = path.resolve("optimized");
    if (!resolvedPath.startsWith(optimizedDir)) {
      return new Response("Invalid path", { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return new Response("Image not found", { status: 404 });
    }

    const originalPath = fullPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(fullPath) || ".jpg");
    let metadata = loadMetadata(fullPath, decodedPath, originalPath);

    if (!metadata) {
      // Create metadata if it doesn't exist
      const { saveMetadata, extractImageMetadata } = await import("./metadata");
      const technical = await extractImageMetadata(fullPath, decodedPath, originalPath);
      metadata = await saveMetadata(fullPath, decodedPath, originalPath, {
        filename: path.basename(fullPath),
        ...technical,
      });
    }

    return {
      success: true,
      metadata,
    };
  } catch (error) {
    logger.error("Error getting metadata:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

// Update metadata for an image
app.put("/api/images/*/metadata", async (context) => {
  try {
    const imagePath = (context.params["*"] as string) || "";
    const decodedPath = decodeURIComponent(imagePath);
    const fullPath = path.join("optimized", decodedPath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const optimizedDir = path.resolve("optimized");
    if (!resolvedPath.startsWith(optimizedDir)) {
      return new Response("Invalid path", { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return new Response("Image not found", { status: 404 });
    }

    const body = await context.request.json();
    
    // Sanitize user inputs
    const sanitizedMetadata: Partial<ImageMetadata> = {
      title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined,
      altText: typeof body.altText === "string" ? body.altText.trim().slice(0, 200) : undefined,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) : undefined,
      caption: typeof body.caption === "string" ? body.caption.trim().slice(0, 500) : undefined,
      keywords: Array.isArray(body.keywords) 
        ? body.keywords.filter((k: any) => typeof k === "string").slice(0, 20).map((k: string) => k.trim().slice(0, 50))
        : undefined,
    };
    
    const originalPath = fullPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(fullPath) || ".jpg");
    
    const updated = await saveMetadata(fullPath, decodedPath, originalPath, sanitizedMetadata);

    return {
      success: true,
      metadata: updated,
    };
  } catch (error) {
    logger.error("Error updating metadata:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

// Get image preview (thumbnail) with caching
app.get("/api/images/*/preview", async (context) => {
  try {
    const wildcard = context.params["*"] as string;
    if (!wildcard) {
      return new Response("Image path required", { status: 400 });
    }
    
    // Decode URL-encoded path (handles %2F for slashes)
    const decodedPath = decodeURIComponent(wildcard);
    logger.debug(`Preview request - wildcard: ${wildcard}, decoded: ${decodedPath}`);
    
    const fullPath = path.join(CONSTANTS.OPTIMIZED_DIR, decodedPath);

    // Security check
    const { valid, filePath, error } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      logger.warn(`Invalid path: ${decodedPath}`, error);
      return new Response(error || "Invalid path", { status: 400 });
    }

    // filePath from validateImagePath already includes baseDir, use it directly
    const finalPath = path.resolve(filePath);
    logger.debug(`Looking for image at: ${finalPath}`);
    
    if (!fs.existsSync(finalPath)) {
      logger.warn(`Image not found: ${finalPath}`, { decodedPath, filePath });
      return new Response("Image not found", { status: 404 });
    }
    
    logger.debug(`Image found, generating thumbnail`);

    // Get cached thumbnail or generate new one
    const thumbnail = await getCachedThumbnail(finalPath, CONSTANTS.THUMBNAIL_SIZE);

    return new Response(thumbnail, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "HIT", // For debugging
      },
    });
  } catch (error) {
    logger.error("Error generating preview:", error);
    return new Response(sanitizeError(error), { status: 500 });
  }
});

// Rename image file with cache invalidation
app.post("/api/images/*/rename", async (context) => {
  try {
    const imagePath = (context.params["*"] as string) || "";
    const decodedPath = decodeURIComponent(imagePath);
    
    // Security check
    const { valid, filePath, error } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      return new Response(error || "Invalid path", { status: 400 });
    }

    const fullPath = path.join(CONSTANTS.OPTIMIZED_DIR, filePath);

    if (!fs.existsSync(fullPath)) {
      return new Response("Image not found", { status: 404 });
    }

    const body = await context.request.json();
    const { newFilename, useSEO } = body;

    if (!newFilename || typeof newFilename !== "string") {
      return {
        success: false,
        error: "newFilename is required and must be a string",
      };
    }

    // Validate new filename
    if (!isImageFile(newFilename)) {
      return {
        success: false,
        error: "New filename must have a valid image extension",
      };
    }

    let finalFilename = newFilename.trim();
    
    // Generate SEO filename if requested
    if (useSEO) {
      const metadata = loadMetadata(fullPath, decodedPath, "");
      const baseName = path.parse(newFilename).name;
      const ext = path.parse(newFilename).ext || path.extname(fullPath);
      const seoName = generateSEOFilename(baseName, metadata?.title, metadata?.altText);
      finalFilename = `${seoName}${ext}`;
    }

    const newPath = await renameImage(fullPath, finalFilename, decodedPath);
    
    // Invalidate cache for old and new paths
    invalidateImageCache(fullPath);
    invalidateImageCache(newPath);
    
    const newRelativePath = path.relative(CONSTANTS.OPTIMIZED_DIR, newPath).replace(/\\/g, "/");

    return {
      success: true,
      newPath: newRelativePath,
      downloadUrl: `/download/${newRelativePath}`,
    };
  } catch (error) {
    logger.error("Error renaming image:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

// Export images for WordPress
app.get("/api/images/export/wordpress", async () => {
  try {
    const images = getAllImages();
    const imagesWithMetadata = await Promise.all(
      images.map(async (img) => {
        let metadata = loadMetadata(img.path, img.relativePath, img.originalPath);
        
        if (!metadata) {
          const { saveMetadata, extractImageMetadata } = await import("./metadata");
          const technical = await extractImageMetadata(img.path, img.relativePath, img.originalPath);
          metadata = await saveMetadata(img.path, img.relativePath, img.originalPath, {
            filename: path.basename(img.path),
            ...technical,
          });
        }

        // WordPress format
        return {
          filename: metadata.filename,
          title: metadata.title || path.parse(metadata.filename).name,
          alt_text: metadata.altText || metadata.title || path.parse(metadata.filename).name,
          caption: metadata.caption || "",
          description: metadata.description || "",
          url: `/download/${img.relativePath}`,
          width: metadata.width,
          height: metadata.height,
          file_size: metadata.fileSize,
          keywords: (metadata.keywords || []).join(", "),
        };
      })
    );

    // Return as CSV for easy import
    const csvHeaders = ["filename", "title", "alt_text", "caption", "description", "url", "width", "height", "file_size", "keywords"];
    const csvRows = imagesWithMetadata.map((img) =>
      csvHeaders.map((header) => {
        const value = img[header as keyof typeof img];
        return typeof value === "string" && value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(",")
    );

    const csv = [csvHeaders.join(","), ...csvRows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="wordpress-import.csv"',
      },
    });
  } catch (error) {
    logger.error("Error exporting for WordPress:", error);
    return {
      success: false,
      error: sanitizeError(error),
    };
  }
});

app.listen(config.port);

logger.info(`Server running at http://localhost:${config.port}`);
logger.info("Available endpoints:");
logger.info("  POST /optimize - Optimize images");
logger.info("  GET  /download/:file - Download optimized image");
logger.info("  GET  /download-all - Download all as ZIP");
logger.info("  GET  /api/images - List all images");
logger.info("  GET  /api/images/*/metadata - Get image metadata");
logger.info("  PUT  /api/images/*/metadata - Update metadata");
logger.info("  GET  /api/images/*/preview - Get thumbnail");
logger.info("  POST /api/images/*/rename - Rename image");
logger.info("  GET  /api/images/export/wordpress - Export CSV");
logger.debug(`Environment: ${config.nodeEnv}, Log Level: ${config.logLevel}`);

