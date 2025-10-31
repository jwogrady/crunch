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
  getMetadataPath,
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

// Middleware to handle URL-encoded paths in /api/images/* routes
// This intercepts requests BEFORE routing to handle URL-encoded slashes (%2F)
app.onRequest(async ({ request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!pathname.startsWith("/api/images/") || pathname === "/api/images" || pathname.startsWith("/api/images/export/")) {
    return; // Let normal routing handle it
  }

  // Match preview (GET), metadata (GET/PUT), and rename (POST) requests
  const previewMatch = pathname.match(/^\/api\/images\/(.+)\/preview$/);
  const metadataMatch = pathname.match(/^\/api\/images\/(.+)\/metadata$/);
  const renameMatch = pathname.match(/^\/api\/images\/(.+)\/rename$/);

  if (!previewMatch && !metadataMatch && !renameMatch) {
    return; // Not a wildcard route we handle, let normal routing handle it
  }

  const encodedPath = previewMatch?.[1] || metadataMatch?.[1] || renameMatch?.[1] || "";
  const decodedPath = decodeURIComponent(encodedPath);

  // Handle preview requests (GET)
  if (previewMatch && request.method === "GET") {
    try {
      const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
      
      if (!valid || !filePath) {
        return Response.json({
          success: false,
          error: validationError || "Invalid path",
        }, { status: 400 });
      }

      let finalPath = filePath;
      
      // If direct path doesn't exist, try to find by filename
      if (!fs.existsSync(finalPath)) {
        const fileName = path.basename(decodedPath);
        const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
        if (found) {
          const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
          const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
          if (foundValidation.valid && foundValidation.filePath) {
            finalPath = foundValidation.filePath;
          } else {
            finalPath = found;
          }
        } else {
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      }

      if (!fs.existsSync(finalPath)) {
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }

      // Generate thumbnail
      const thumbnail = await getCachedThumbnail(finalPath, CONSTANTS.THUMBNAIL_SIZE);

      return new Response(thumbnail, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      logger.error("Error generating preview in middleware:", error);
      return Response.json({
        success: false,
        error: sanitizeError(error),
      }, { status: 500 });
    }
  }

  // Handle metadata PUT requests
  if (metadataMatch && request.method === "PUT") {
    try {
      const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
      
      if (!valid || !filePath) {
        return Response.json({
          success: false,
          error: validationError || "Invalid path",
        }, { status: 400 });
      }

      let finalPath = filePath;
      
      // If direct path doesn't exist, try to find by filename
      if (!fs.existsSync(finalPath)) {
        const fileName = path.basename(decodedPath);
        const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
        if (found) {
          const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
          const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
          if (foundValidation.valid && foundValidation.filePath) {
            finalPath = foundValidation.filePath;
          } else {
            finalPath = found;
          }
        } else {
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      }

      if (!fs.existsSync(finalPath)) {
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }

      const body = await request.json();
      const relativePathForMetadata = path.relative(CONSTANTS.OPTIMIZED_DIR, finalPath).replace(/\\/g, "/");
      const originalPath = finalPath.replace(/optimized/g, "originals");
      const metadata = await saveMetadata(finalPath, relativePathForMetadata, originalPath, body);

      return Response.json({ success: true, metadata });
    } catch (error) {
      logger.error("Error saving metadata in middleware:", error);
      return Response.json({
        success: false,
        error: sanitizeError(error),
      }, { status: 500 });
    }
  }

  // Handle metadata GET requests
  if (metadataMatch && request.method === "GET") {
    try {
      const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
      
      if (!valid || !filePath) {
        return Response.json({
          success: false,
          error: validationError || "Invalid path",
        }, { status: 400 });
      }

      let finalPath = filePath;
      
      // If direct path doesn't exist, try to find by filename
      if (!fs.existsSync(finalPath)) {
        const fileName = path.basename(decodedPath);
        const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
        if (found) {
          const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
          const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
          if (foundValidation.valid && foundValidation.filePath) {
            finalPath = foundValidation.filePath;
          } else {
            finalPath = found;
          }
        } else {
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      }

      const relativePathForMetadata = path.relative(CONSTANTS.OPTIMIZED_DIR, finalPath).replace(/\\/g, "/");
      const originalPath = finalPath.replace(/optimized/g, "originals");
      const metadata = loadMetadata(finalPath, relativePathForMetadata, originalPath);

      return Response.json({ success: true, metadata });
    } catch (error) {
      logger.error("Error loading metadata in middleware:", error);
      return Response.json({
        success: false,
        error: sanitizeError(error),
      }, { status: 500 });
    }
  }

  // Handle rename POST requests
  if (renameMatch && request.method === "POST") {
    try {
      const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
      
      if (!valid || !filePath) {
        return Response.json({
          success: false,
          error: validationError || "Invalid path",
        }, { status: 400 });
      }

      let finalPath = filePath;
      
      // If direct path doesn't exist, try to find by filename
      if (!fs.existsSync(finalPath)) {
        const fileName = path.basename(decodedPath);
        const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
        if (found) {
          const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
          const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
          if (foundValidation.valid && foundValidation.filePath) {
            finalPath = foundValidation.filePath;
          } else {
            finalPath = found;
          }
        } else {
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      }

      if (!fs.existsSync(finalPath)) {
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }

      const body = await request.json();
      const { newFilename, useSEO } = body;

      if (!newFilename || typeof newFilename !== "string") {
        return Response.json({
          success: false,
          error: "newFilename is required and must be a string",
        }, { status: 400 });
      }

      // Validate new filename
      if (!isImageFile(newFilename)) {
        return Response.json({
          success: false,
          error: "New filename must have a valid image extension",
        }, { status: 400 });
      }

      let finalFilename = newFilename.trim();
      
      // Get current relativePath for metadata lookup
      const currentRelativePath = path.relative(CONSTANTS.OPTIMIZED_DIR, finalPath).replace(/\\/g, "/");
      
      // Generate SEO filename if requested
      if (useSEO) {
        const originalPath = finalPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(finalPath) || ".jpg");
        const metadata = loadMetadata(finalPath, currentRelativePath, originalPath);
        const baseName = path.parse(newFilename).name;
        const ext = path.parse(newFilename).ext || path.extname(finalPath);
        const seoName = generateSEOFilename(baseName, metadata?.title, metadata?.altText);
        finalFilename = `${seoName}${ext}`;
      }

      const newPath = await renameImage(finalPath, finalFilename, currentRelativePath);
      
      // Invalidate cache for old and new paths
      invalidateImageCache(finalPath);
      invalidateImageCache(newPath);
      
      const newRelativePath = path.relative(CONSTANTS.OPTIMIZED_DIR, newPath).replace(/\\/g, "/");

      return Response.json({
        success: true,
        newPath: newRelativePath,
        downloadUrl: `/download/${newRelativePath}`,
        previewUrl: `/api/images/${encodeURIComponent(newRelativePath)}/preview`,
      });
    } catch (error) {
      logger.error("Error renaming image in middleware:", error);
      return Response.json({
        success: false,
        error: sanitizeError(error),
      }, { status: 500 });
    }
  }

  // Return undefined to let normal routing handle other cases
  return undefined;
});

// IMPORTANT: Route registration order matters in Elysia
// More specific routes must be registered BEFORE wildcard routes
// All API routes are registered before the catch-all /* route at the end

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
        
        const urlResults = results.map((r) => {
          // Convert full path to relative path (remove optimized/ prefix)
          const relativePath = r.output.replace(/\\/g, "/").replace(/^optimized\//, "");
          return {
            ...r,
            downloadUrl: `/download/${relativePath}`,
          };
        });
        
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
    const encodedPath = (context.params["*"] as string) || "";
    // Decode URL-encoded path (handles spaces, special characters)
    const relativePath = decodeURIComponent(encodedPath);
    
    // Validate and sanitize path
    const { valid, filePath, error } = validateImagePath(relativePath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      return new Response(error || "Invalid path", { status: 400 });
    }
    
    // Try direct path first
    let finalPath = filePath;
    
    // If direct path doesn't exist, try to find by filename (backwards compatibility)
    if (!fs.existsSync(finalPath)) {
      // Use decoded filename for search
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
    // Check if optimized directory exists
    if (!fs.existsSync(CONSTANTS.OPTIMIZED_DIR)) {
      logger.debug(`Optimized directory does not exist: ${CONSTANTS.OPTIMIZED_DIR}`);
      return Response.json({
        success: true,
        images: [],
        count: 0,
        message: "No images uploaded yet. Upload images to get started.",
      });
    }

    const images = getAllImages();
    logger.debug(`Found ${images.length} images in optimized directory`);

    if (images.length === 0) {
      return Response.json({
        success: true,
        images: [],
        count: 0,
        message: "No images found. Upload and optimize images first.",
      });
    }

    const imagesWithMetadata = await Promise.all(
      images.map(async (img) => {
        try {
          // Check if image file actually exists - skip if missing
          if (!fs.existsSync(img.path)) {
            logger.warn(`Image file does not exist, skipping: ${img.path}`);
            // Don't include images without actual files
            return null;
          }

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
        } catch (error) {
          logger.error(`Error processing image ${img.path}:`, error);
          // Return basic info even if metadata extraction fails
          return {
            filename: path.basename(img.path),
            relativePath: img.relativePath,
            path: img.path,
            previewUrl: `/api/images/${encodeURIComponent(img.relativePath)}/preview`,
            downloadUrl: `/download/${img.relativePath}`,
            error: sanitizeError(error),
          };
        }
      })
    );

    // Filter out null entries (missing files with no metadata)
    const validImages = imagesWithMetadata.filter((img): img is NonNullable<typeof img> => img !== null);

    return Response.json({
      success: true,
      images: validImages,
      count: validImages.length,
    });
  } catch (error) {
    logger.error("Error listing images:", error);
    return Response.json({
      success: false,
      error: sanitizeError(error),
    }, { status: 500 });
  }
});

// Get metadata for a specific image
app.get("/api/images/*/metadata", async (context) => {
  try {
    const wildcard = context.params["*"] as string;
    if (!wildcard) {
      return Response.json({
        success: false,
        error: "Image path required",
      }, { status: 400 });
    }
    
    const decodedPath = decodeURIComponent(wildcard);
    logger.debug(`Metadata request - wildcard: ${wildcard}, decoded: ${decodedPath}`);
    
    // Use validateImagePath for security and proper path resolution
    const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      logger.warn(`Invalid path for metadata: ${decodedPath}`, validationError);
      return Response.json({
        success: false,
        error: validationError || "Invalid path",
      }, { status: 400 });
    }

    // Try direct path first
    let finalPath = path.resolve(filePath);
    logger.debug(`Looking for metadata at: ${finalPath}`);
    
    // If direct path doesn't exist, try to find by filename (backwards compatibility)
    if (!fs.existsSync(finalPath)) {
      const fileName = path.basename(decodedPath);
      logger.debug(`Direct path not found for metadata, searching for filename: ${fileName}`);
      const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
      if (found) {
        const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
        const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
        if (foundValidation.valid && foundValidation.filePath) {
          finalPath = foundValidation.filePath;
          logger.debug(`Found image for metadata at: ${finalPath}`);
        } else {
          logger.warn(`Found file but validation failed: ${found}`);
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      } else {
        logger.warn(`Image not found for metadata: ${finalPath}`, { decodedPath, filePath, searchedFileName: fileName });
        // Check if optimized directory even exists
        if (!fs.existsSync(CONSTANTS.OPTIMIZED_DIR)) {
          logger.error(`Optimized directory does not exist: ${CONSTANTS.OPTIMIZED_DIR}`);
          return Response.json({
            success: false,
            error: "Optimized directory not found. Please upload images first.",
          }, { status: 404 });
        }
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }
    }
    
    // Update decodedPath to match found file for metadata consistency
    const relativePathForMetadata = path.relative(CONSTANTS.OPTIMIZED_DIR, finalPath);
    const originalPath = finalPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(finalPath) || ".jpg");
    
    let metadata = loadMetadata(finalPath, relativePathForMetadata, originalPath);

    if (!metadata) {
      // Create metadata if it doesn't exist
      const { saveMetadata, extractImageMetadata } = await import("./metadata");
      const technical = await extractImageMetadata(finalPath, relativePathForMetadata, originalPath);
      metadata = await saveMetadata(finalPath, relativePathForMetadata, originalPath, {
        filename: path.basename(finalPath),
        ...technical,
      });
    }

    return Response.json({
      success: true,
      metadata,
    });
  } catch (error) {
    logger.error("Error getting metadata:", error);
    return Response.json({
      success: false,
      error: sanitizeError(error),
    }, { status: 500 });
  }
});

// Update metadata for an image
app.put("/api/images/*/metadata", async (context) => {
  try {
    const imagePath = (context.params["*"] as string) || "";
    const decodedPath = decodeURIComponent(imagePath);
    
    // Use validateImagePath for security and proper path resolution
    const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      logger.warn(`Invalid path for metadata update: ${decodedPath}`, validationError);
      return Response.json({
        success: false,
        error: validationError || "Invalid path",
      }, { status: 400 });
    }

    // Try direct path first
    let finalPath = path.resolve(filePath);
    
    // If direct path doesn't exist, try to find by filename (backwards compatibility)
    if (!fs.existsSync(finalPath)) {
      const fileName = path.basename(decodedPath);
      logger.debug(`Direct path not found for metadata update, searching for filename: ${fileName}`);
      const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
      if (found) {
        const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
        const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
        if (foundValidation.valid && foundValidation.filePath) {
          finalPath = foundValidation.filePath;
          logger.debug(`Found image for metadata update at: ${finalPath}`);
        } else {
          logger.warn(`Found file but validation failed: ${found}`);
          return Response.json({
            success: false,
            error: "Image not found",
          }, { status: 404 });
        }
      } else {
        logger.warn(`Image not found for metadata update: ${finalPath}`, { decodedPath, filePath, searchedFileName: fileName });
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }
    }
    
    // Update decodedPath to match found file for metadata consistency
    const relativePathForMetadata = path.relative(CONSTANTS.OPTIMIZED_DIR, finalPath);

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
    
    const originalPath = finalPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(finalPath) || ".jpg");
    
    const updated = await saveMetadata(finalPath, relativePathForMetadata, originalPath, sanitizedMetadata);

    return Response.json({
      success: true,
      metadata: updated,
    });
  } catch (error) {
    logger.error("Error updating metadata:", error);
    return Response.json({
      success: false,
      error: sanitizeError(error),
    }, { status: 500 });
  }
});

// Get image preview (thumbnail) with caching
app.get("/api/images/*/preview", async (context) => {
  try {
    const wildcard = context.params["*"] as string;
    if (!wildcard) {
      return Response.json({
        success: false,
        error: "Image path required",
      }, { status: 400 });
    }
    
    // Decode URL-encoded path (handles %2F for slashes)
    const decodedPath = decodeURIComponent(wildcard);
    logger.debug(`Preview request - wildcard: ${wildcard}, decoded: ${decodedPath}`);

    // Security check
    const { valid, filePath, error: validationError } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);
    
    if (!valid || !filePath) {
      logger.warn(`Invalid path for preview: ${decodedPath}`, validationError);
      return Response.json({
        success: false,
        error: validationError || "Invalid path",
      }, { status: 400 });
    }

    // filePath from validateImagePath is already an absolute resolved path
    let finalPath = filePath;
    logger.debug(`Looking for preview image at: ${finalPath}`);
    
    // If direct path doesn't exist, try to find by filename (backwards compatibility)
    // This matches the download endpoint logic exactly
    if (!fs.existsSync(finalPath)) {
      // Use decoded filename for search (same as download endpoint)
      const fileName = path.basename(decodedPath);
      logger.debug(`Direct path not found for preview, searching for filename: ${fileName}`);
      const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
      if (found) {
        // Validate found path too (same as download endpoint)
        const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found);
        const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
        if (foundValidation.valid && foundValidation.filePath) {
          finalPath = foundValidation.filePath;
          logger.debug(`Found preview image at: ${finalPath}`);
        } else {
          // If validation fails, use the found path directly (same fallback as download)
          finalPath = found;
          logger.debug(`Using found file path directly: ${finalPath}`);
        }
      } else {
        logger.warn(`Preview image not found: ${finalPath}`, { decodedPath, filePath, searchedFileName: fileName });
        // Return 404 so img onError handler can show placeholder UI
        // The frontend has onError handlers that display "No Preview" placeholders
        return Response.json({
          success: false,
          error: "Image not found",
        }, { status: 404 });
      }
    }
    
    logger.debug(`Preview image found, generating thumbnail from: ${finalPath}`);

    // Verify file actually exists before generating thumbnail
    if (!fs.existsSync(finalPath)) {
      logger.warn(`Preview file does not exist: ${finalPath}`);
      return Response.json({
        success: false,
        error: "Image not found",
      }, { status: 404 });
    }

    // Get cached thumbnail or generate new one
    try {
      const thumbnail = await getCachedThumbnail(finalPath, CONSTANTS.THUMBNAIL_SIZE);

      return new Response(thumbnail, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (thumbError) {
      logger.error(`Error generating thumbnail for ${finalPath}:`, thumbError);
      // Return 404 so frontend onError handler can show placeholder
      return Response.json({
        success: false,
        error: "Failed to generate preview",
      }, { status: 500 });
    }
  } catch (error) {
    logger.error("Error generating preview:", error);
    return Response.json({
      success: false,
      error: sanitizeError(error),
    }, { status: 500 });
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
      return Response.json({
        success: false,
        error: error || "Invalid path",
      }, { status: 400 });
    }

    // filePath from validateImagePath is already an absolute resolved path
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
      return Response.json({
        success: false,
        error: "Image not found",
      }, { status: 404 });
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
    
    // Get current relativePath for metadata lookup
    const currentRelativePath = path.relative(CONSTANTS.OPTIMIZED_DIR, fullPath).replace(/\\/g, "/");
    
    // Generate SEO filename if requested
    if (useSEO) {
      const originalPath = fullPath.replace(/optimized/g, "originals").replace(/\.(webp|jpeg)$/i, path.extname(fullPath) || ".jpg");
      const metadata = loadMetadata(fullPath, currentRelativePath, originalPath);
      const baseName = path.parse(newFilename).name;
      const ext = path.parse(newFilename).ext || path.extname(fullPath);
      const seoName = generateSEOFilename(baseName, metadata?.title, metadata?.altText);
      finalFilename = `${seoName}${ext}`;
    }

    const newPath = await renameImage(fullPath, finalFilename, currentRelativePath);
    
    // Invalidate cache for old and new paths
    invalidateImageCache(fullPath);
    invalidateImageCache(newPath);
    
    const newRelativePath = path.relative(CONSTANTS.OPTIMIZED_DIR, newPath).replace(/\\/g, "/");

    return Response.json({
      success: true,
      newPath: newRelativePath,
      downloadUrl: `/download/${newRelativePath}`,
      previewUrl: `/api/images/${encodeURIComponent(newRelativePath)}/preview`,
    });
    } catch (error) {
      logger.error("Error renaming image:", error);
      return Response.json({
        success: false,
        error: sanitizeError(error),
      }, { status: 500 });
    }
});

// Delete single image
app.delete("/api/images/*", async (context) => {
  try {
    const wildcard = context.params["*"] as string;
    if (!wildcard) {
      return Response.json({
        success: false,
        error: "Image path required",
      }, { status: 400 });
    }

    const decodedPath = decodeURIComponent(wildcard);
    const { valid, filePath, error } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);

    if (!valid || !filePath || !fs.existsSync(filePath)) {
      return Response.json({
        success: false,
        error: error || "Invalid path or file not found",
      }, { status: 400 });
    }

    // Delete optimized image
    fs.unlinkSync(filePath);
    
    // Delete metadata
    const metadataPath = getMetadataPath(filePath);
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    
    // Delete original if it exists
    const originalPath = filePath.replace(/optimized/g, "originals");
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }
    
    // Invalidate cache
    invalidateImageCache(filePath);

    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting image:", error);
    return Response.json({
      success: false,
      error: sanitizeError(error),
    }, { status: 500 });
  }
});

// Bulk delete images
app.delete("/api/images/bulk", async (context) => {
  try {
    const body = await context.request.json();
    const { relativePaths } = body;

    if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
      return Response.json({ success: false, error: "relativePaths array is required" }, { status: 400 });
    }
    
    const results = [];
    for (const relativePath of relativePaths) {
      try {
        const decodedPath = decodeURIComponent(relativePath);
        let { valid, filePath, error } = validateImagePath(decodedPath, CONSTANTS.OPTIMIZED_DIR);

        // If validation fails or file doesn't exist, try to find by filename
        if (!valid || !filePath || !fs.existsSync(filePath)) {
          const fileName = path.basename(decodedPath);
          const found = findFileRecursive(CONSTANTS.OPTIMIZED_DIR, fileName);
          if (found) {
            // Validate the found path
            const foundRelative = path.relative(CONSTANTS.OPTIMIZED_DIR, found).replace(/\\/g, "/");
            const foundValidation = validateImagePath(foundRelative, CONSTANTS.OPTIMIZED_DIR);
            if (foundValidation.valid && foundValidation.filePath && fs.existsSync(foundValidation.filePath)) {
              filePath = foundValidation.filePath;
              valid = true;
              error = undefined;
            } else if (fs.existsSync(found)) {
              // Use found path directly as fallback
              filePath = found;
              valid = true;
              error = undefined;
            }
          }
        }

        if (!valid || !filePath || !fs.existsSync(filePath)) {
          results.push({ relativePath, success: false, error: error || "Invalid path or file not found" });
          continue;
        }

        fs.unlinkSync(filePath);
        const metadataPath = getMetadataPath(filePath);
        if (fs.existsSync(metadataPath)) {
          fs.unlinkSync(metadataPath);
        }
        const originalPath = filePath.replace(/optimized/g, "originals");
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
        invalidateImageCache(filePath);
        results.push({ relativePath, success: true });
      } catch (error) {
        results.push({ relativePath, success: false, error: sanitizeError(error) });
      }
    }

    return Response.json({
      success: true,
      results,
      deleted: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    logger.error("Error in bulk delete:", error);
    return Response.json({ success: false, error: sanitizeError(error) }, { status: 500 });
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

        // WordPress import format (WP All Import / Ultimate CSV Importer compatible)
        // Generate absolute URL if BASE_URL is configured, otherwise use relative path
        const relativeUrl = `/download/${img.relativePath}`;
        const fileUrl = config.baseUrl 
          ? `${config.baseUrl.replace(/\/$/, "")}${relativeUrl}` 
          : relativeUrl;
        const filePath = img.path;
        
        return {
          // Required for import plugins
          file_path: filePath, // Absolute file path for local imports (use this if uploading files directly)
          file_url: fileUrl,   // Absolute or relative URL (use relative if BASE_URL not set, will need to be replaced)
          file_url_relative: relativeUrl, // Always relative path for reference/replacement
          title: metadata.title || "",
          alt_text: metadata.altText || metadata.title || "",
          caption: metadata.caption || "",
          description: metadata.description || "",
          
          // WordPress media attachment fields
          post_title: metadata.title || path.parse(metadata.filename).name,
          post_excerpt: metadata.caption || "",
          post_content: metadata.description || "",
          post_type: "attachment",
          
          // Image metadata
          width: metadata.width || 0,
          height: metadata.height || 0,
          file_size: metadata.fileSize || 0,
          
          // Additional metadata (as custom fields)
          keywords: (metadata.keywords || []).join(", "),
          filename: metadata.filename,
        };
      })
    );

    // Return as CSV - WordPress import plugin compatible format
    // WP All Import / Ultimate CSV Importer standard columns
    const csvHeaders = [
      "file_path",
      "file_url",
      "file_url_relative",
      "filename",
      "title",
      "post_title",
      "alt_text",
      "caption",
      "post_excerpt",
      "description",
      "post_content",
      "post_type",
      "width",
      "height",
      "file_size",
      "keywords"
    ];
    const csvRows = imagesWithMetadata.map((img) =>
      csvHeaders.map((header) => {
        const value = img[header as keyof typeof img];
        // Handle undefined/null values
        if (value === undefined || value === null) {
          return "";
        }
        // Convert to string and escape commas/quotes for CSV
        const stringValue = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    );

    const csv = [csvHeaders.join(","), ...csvRows].join("\n");

    // Add BOM for Excel compatibility (UTF-8 with BOM)
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    return new Response(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="wordpress-media-import.csv"',
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

// Serve static files in production (for Railway full-stack deployment)
if (config.nodeEnv === "production") {
  const distPath = path.join(process.cwd(), "src/web/dist");
  
  // Try to build if dist doesn't exist (fallback for Railway)
  if (!fs.existsSync(distPath)) {
    logger.warn("Static dist directory not found. Attempting to build...");
    try {
      // Use Bun.spawn to run build command
      const proc = Bun.spawn(["bun", "run", "build"], {
        cwd: process.cwd(),
        stdout: "inherit",
        stderr: "inherit",
      });
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        logger.info("Frontend built successfully");
      } else {
        throw new Error(`Build failed with exit code ${exitCode}`);
      }
    } catch (error) {
      logger.error("Failed to build frontend:", error);
      logger.warn("Continuing without static file serving...");
    }
  }
  
  // Check if dist directory exists after potential build
  if (fs.existsSync(distPath)) {
    // Serve static files - this should only match non-API routes
    // API routes are registered above and should match first
    app.get("/*", (context) => {
      const url = new URL(context.request.url);
      let filePath = url.pathname;
      
      // NEVER serve static files for API routes - they should be handled by API routes above
      if (filePath.startsWith("/api") || filePath.startsWith("/optimize") || filePath.startsWith("/download")) {
        // This should not happen if routes are registered correctly, but return proper JSON error just in case
        // This is a fallback - API routes registered above should match first
        return Response.json({
          success: false,
          error: "Not Found",
        }, { status: 404 });
      }
      
      // Default to index.html for root
      if (filePath === "/") {
        return Bun.file(path.join(distPath, "index.html"));
      }
      
      // Try to serve the requested file
      const requestedFile = path.join(distPath, filePath);
      
      // If file exists, serve it
      if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
        // Determine Content-Type based on file extension for proper browser handling
        const ext = path.extname(filePath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".js": "application/javascript; charset=utf-8",
          ".mjs": "application/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".json": "application/json; charset=utf-8",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
          ".eot": "application/vnd.ms-fontobject",
          ".ico": "image/x-icon",
        };
        
        const contentType = contentTypeMap[ext] || "application/octet-stream";
        const file = Bun.file(requestedFile);
        
        // Return file with proper Content-Type and cache headers
        return new Response(file, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": ext === ".html" ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable",
          },
        });
      }
      
      // If file doesn't exist and it's not an asset (no extension), serve index.html (SPA fallback)
      if (!filePath.includes(".")) {
        return Bun.file(path.join(distPath, "index.html"));
      }
      
      // Asset file not found
      return new Response("Not Found", { status: 404 });
    });
    
    logger.info("Static file serving enabled from: src/web/dist");
  } else {
    logger.warn("Static dist directory not found. Skipping static file serving.");
    logger.warn("Build frontend first: bun run build");
  }
}

// Add custom 404 handler for better debugging
app.onError(({ code, error, path, set }) => {
  if (code === "NOT_FOUND") {
    logger.warn(`Route not found: ${path} - This may indicate a routing issue`);
    // Return JSON for API routes, plain text for others
    if (path.startsWith("/api")) {
      set.status = 404;
      return Response.json({
        success: false,
        error: "Route not found",
        path,
      }, { status: 404 });
    }
  }
  // Let Elysia handle other errors normally
});

// Start server (async to allow build fallback)
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
    logger.info("  DELETE /api/images/* - Delete single image");
    logger.info("  DELETE /api/images/bulk - Bulk delete images");
    logger.debug(`Environment: ${config.nodeEnv}, Log Level: ${config.logLevel}`);

