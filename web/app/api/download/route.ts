import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";

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

    const outputDir = path.join(process.cwd(), "tmp", "output", jobId);
    const filePath = path.join(outputDir, filename);

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

