import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import { getJob } from "@/lib/jobStore";
import { validatePrd, getValidationSummary } from "@/lib/prdValidator";

export const runtime = "nodejs";

/**
 * GET /api/prd?jobId=<jobId>
 * Loads PRD artifacts for a completed job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    console.log("[prd] API called with jobId:", jobId);

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId parameter is required" },
        { status: 400 }
      );
    }

    // Get job state to ensure it exists and is complete
    const job = getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "complete") {
      return NextResponse.json(
        { error: `Job is not complete (status: ${job.status})` },
        { status: 400 }
      );
    }

    // Load PRD artifacts from output directory
    const outputDir = job.outputDir || path.join(process.cwd(), "tmp", "output", jobId);
    
    try {
      // Read prd-structured.json
      const jsonPath = path.join(outputDir, "prd-structured.json");
      const jsonContent = await fs.readFile(jsonPath, "utf-8");
      const prdJson = JSON.parse(jsonContent);

      // Read markdown PRD (find the file with PRD_ prefix)
      let markdown = "";
      let markdownFilename = job.markdownFilename || "";
      
      if (markdownFilename) {
        const markdownPath = path.join(outputDir, markdownFilename);
        markdown = await fs.readFile(markdownPath, "utf-8");
      } else {
        // Try to find markdown file
        const files = await fs.readdir(outputDir);
        const mdFile = files.find(f => f.startsWith("PRD_") && f.endsWith(".md"));
        if (mdFile) {
          markdownFilename = mdFile;
          const markdownPath = path.join(outputDir, mdFile);
          markdown = await fs.readFile(markdownPath, "utf-8");
        }
      }

      // Read questions for client (optional)
      let questions = null;
      try {
        const questionsPath = path.join(outputDir, "questions-for-client.json");
        const questionsContent = await fs.readFile(questionsPath, "utf-8");
        questions = JSON.parse(questionsContent);
      } catch {
        // Questions file might not exist
      }

      // Check for version history
      const files = await fs.readdir(outputDir);
      const versions = files
        .filter(f => f.match(/prd-structured\.v\d+\.json/))
        .map(f => parseInt(f.match(/v(\d+)\.json/)?.[1] || "0"))
        .sort((a, b) => b - a); // Sort descending

      const currentVersion = versions.length > 0 ? Math.max(...versions) : 0;
      const hasVersionHistory = versions.length > 0;

      // Run validation on the PRD JSON
      const validationResult = validatePrd(prdJson);
      const validationSummary = getValidationSummary(validationResult);

      return NextResponse.json({
        jobId,
        prdJson,
        markdown,
        markdownFilename,
        questions,
        version: currentVersion,
        hasVersionHistory,
        outputDir,
        validationResult: {
          isValid: validationResult.isValid,
          score: validationResult.score,
          errors: validationResult.errors.length,
          warnings: validationResult.warnings.length,
          summary: validationSummary,
          details: validationResult,
        },
      });

    } catch (error) {
      console.error("[prd] Error loading PRD artifacts:", error);
      return NextResponse.json(
        { 
          error: "Failed to load PRD artifacts",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[prd] Error in GET handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
