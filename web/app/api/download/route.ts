import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Sanitizes a filename by removing path separators and dangerous characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, "") // Remove path separators
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove Windows reserved characters
    .trim();
}

/**
 * Validates that a file path stays within a base directory
 */
function validatePath(filePath: string, baseDir: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, filePath);
  
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  
  return resolvedPath;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");
    const filename = searchParams.get("file");

    if (!jobId || !filename) {
      return NextResponse.json(
        { error: "jobId and file parameters are required" },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = sanitizeFilename(filename);
    
    // Validate jobId doesn't contain path separators
    if (jobId.includes("/") || jobId.includes("\\") || jobId.includes("..")) {
      return NextResponse.json(
        { error: "Invalid jobId" },
        { status: 400 }
      );
    }

    const outputDir = path.join(process.cwd(), "tmp", "output", jobId);
    
    // Validate that the file path stays within the output directory
    let filePath: string;
    try {
      filePath = validatePath(sanitizedFilename, outputDir);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Validate file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Read and return file
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    const contentType =
      fileExtension === ".json"
        ? "application/json"
        : fileExtension === ".md"
        ? "text/markdown"
        : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

