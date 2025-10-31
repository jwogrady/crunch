import sharp from "sharp";
import fs from "fs";
import path from "path";

export interface OptimizationOptions {
  width: number;
  quality: number;
  format: "jpeg" | "webp" | "both";
}

export interface OptimizationResult {
  name: string;
  originalSize: number;
  optimizedSize: number;
  output: string;
  originalPath: string;
  savings: number;
  savingsPercent: number;
}

/**
 * Get date-based folder path (year/month/day)
 */
function getDateFolder(baseDir: string = ""): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return path.join(baseDir, String(year), month, day);
}

export async function optimizeImage(
  buffer: Buffer,
  originalName: string,
  options: OptimizationOptions,
  outputDir: string = "optimized",
  originalsDir: string = "originals"
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  const originalSize = buffer.length;
  const baseName = path.parse(originalName).name;
  const originalExt = path.parse(originalName).ext || ".jpg";

  // Get date-based folders
  const dateFolder = getDateFolder();
  const optimizedDateDir = path.join(outputDir, dateFolder);
  const originalsDateDir = path.join(originalsDir, dateFolder);

  // Ensure output directories exist
  if (!fs.existsSync(optimizedDateDir)) {
    fs.mkdirSync(optimizedDateDir, { recursive: true });
  }
  if (!fs.existsSync(originalsDateDir)) {
    fs.mkdirSync(originalsDateDir, { recursive: true });
  }

  // Save original file for archival
  const originalPath = path.join(originalsDateDir, originalName);
  fs.writeFileSync(originalPath, buffer);

  if (options.format === "both") {
    // Generate both JPEG and WebP
    const [jpegResult, webpResult] = await Promise.all([
      generateFormat(buffer, baseName, "jpeg", options, optimizedDateDir, originalSize, originalPath),
      generateFormat(buffer, baseName, "webp", options, optimizedDateDir, originalSize, originalPath),
    ]);
    results.push(jpegResult, webpResult);
  } else {
    const result = await generateFormat(
      buffer,
      baseName,
      options.format,
      options,
      optimizedDateDir,
      originalSize,
      originalPath
    );
    results.push(result);
  }

  return results;
}

async function generateFormat(
  buffer: Buffer,
  baseName: string,
  format: "jpeg" | "webp",
  options: OptimizationOptions,
  outputDir: string,
  originalSize: number,
  originalPath: string
): Promise<OptimizationResult> {
  const outputPath = path.join(outputDir, `${baseName}.${format}`);
  
  let pipeline = sharp(buffer);

  // Resize if width is specified
  if (options.width > 0) {
    pipeline = pipeline.resize({
      width: options.width,
      withoutEnlargement: true,
    });
  }

  // Apply format-specific settings
  if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: options.quality });
  } else if (format === "webp") {
    pipeline = pipeline.webp({ quality: options.quality });
  }

  await pipeline.toFile(outputPath);

  const stats = fs.statSync(outputPath);
  const optimizedSize = stats.size;
  const savings = originalSize - optimizedSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

  // Save initial metadata
  const { saveMetadata } = await import("./metadata");
  // Calculate relativePath from the outputDir (should be "optimized")
  // Use path.relative to get path relative to optimized directory
  const relativePath = path.relative(outputDir, outputPath).replace(/\\/g, "/");
  await saveMetadata(outputPath, relativePath, originalPath, {
    filename: `${baseName}.${format}`,
  });

  return {
    name: `${baseName}.${format}`,
    originalSize,
    optimizedSize,
    output: outputPath,
    originalPath,
    savings,
    savingsPercent: parseFloat(savingsPercent),
  };
}

