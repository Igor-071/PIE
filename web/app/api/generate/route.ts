import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createJob, updateJob, isJobCancelled } from "@/lib/jobStore";
import { loadCoreModules, type CoreModules } from "@/lib/coreModules";

// Route segment configuration for Next.js App Router
// Increase timeout for long-running PRD generation (5 minutes)
export const maxDuration = 300;

// Set runtime to nodejs to handle file processing
export const runtime = "nodejs";

// Load environment variables from parent directory
const envPath = path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });
console.log(`[generate] Loading env from: ${envPath}`);
console.log(`[generate] OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);

export async function POST(request: NextRequest) {
  console.log("[generate] POST request received");
  
  // Ensure we always return JSON, even if there's an unexpected error
  try {
    // Load core modules using the wrapper
    let coreModules: CoreModules;
    try {
      console.log("[generate] Loading core modules...");
      coreModules = await loadCoreModules();
      console.log("[generate] Core modules loaded successfully");
    } catch (importError) {
      console.error("[generate] Failed to import core modules:", importError);
      const errorMessage = importError instanceof Error ? importError.message : String(importError);
      const errorStack = importError instanceof Error ? importError.stack : undefined;
      console.error("[generate] Error stack:", errorStack);
      
      // Provide more helpful error messages
      let userMessage = "Failed to load core modules";
      let hint = "Please ensure the parent project is built: npm run build in product-intelligence-engine directory";
      
      if (errorMessage.includes("Cannot find module") || errorMessage.includes("not found")) {
        userMessage = "Core modules not found. The project needs to be built.";
        hint = "Run 'cd product-intelligence-engine && npm run build' to compile the core modules.";
      } else if (errorMessage.includes("Cannot load core module")) {
        userMessage = errorMessage;
        hint = "Make sure you're running the web app from the correct directory and that the build completed successfully.";
      } else if (errorMessage.includes("pdf-parse") || errorMessage.includes("mammoth") || errorMessage.includes("adm-zip")) {
        userMessage = "Missing dependencies in core modules";
        hint = "Run 'cd product-intelligence-engine && npm install' to install required dependencies.";
      }
      
      return NextResponse.json(
        {
          error: userMessage,
          details: errorMessage,
          hint,
          stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        },
        { status: 500 }
      );
    }

    try {
      console.log("[generate] Parsing form data...");
      const formData = await request.formData();
      console.log("[generate] Form data parsed successfully");
      
      const zipFile = formData.get("zipFile") as File | null;
      const briefText = formData.get("briefText") as string | null;
      const briefFiles = formData.getAll("briefFiles") as File[];

      console.log(`[generate] ZIP file: ${zipFile ? `${zipFile.name} (${zipFile.size} bytes)` : 'none'}`);
      console.log(`[generate] Brief text: ${briefText ? briefText.length + ' chars' : 'none'}`);
      console.log(`[generate] Brief files: ${briefFiles.length}`);

      if (!zipFile) {
        return NextResponse.json(
          { error: "ZIP file is required" },
          { status: 400 }
        );
      }

      // Validate file type
      if (!zipFile.name.toLowerCase().endsWith(".zip")) {
        return NextResponse.json(
          { error: "File must be a ZIP archive" },
          { status: 400 }
        );
      }

      // Validate file size limits
      const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
      const MAX_BRIEF_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (zipFile.size > MAX_ZIP_SIZE) {
        return NextResponse.json(
          { error: `ZIP file size exceeds maximum allowed size of ${MAX_ZIP_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Validate brief file sizes
      for (const briefFile of briefFiles) {
        if (briefFile.size > MAX_BRIEF_FILE_SIZE) {
          return NextResponse.json(
            { error: `Brief file "${briefFile.name}" exceeds maximum allowed size of ${MAX_BRIEF_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }
      }

      // Create job
      const jobId = createJob();
      console.log("[generate] Created job:", jobId);

      // Process asynchronously with imported modules
      // Use setImmediate to ensure the response is sent before processing starts
      setImmediate(() => {
        processJob(jobId, zipFile, briefText, briefFiles, coreModules).catch((error) => {
          console.error("[generate] Error in processJob:", error);
          console.error("[generate] Error stack:", error instanceof Error ? error.stack : undefined);
          updateJob(jobId, {
            status: "error",
            progress: 0,
            message: "Processing failed",
            error: error instanceof Error ? error.message : String(error),
          });
        });
      });

      console.log("[generate] Returning success response for job:", jobId);
      return NextResponse.json({
        jobId,
        status: "pending",
        message: "Job created successfully",
      });
    } catch (error) {
      console.error("[generate] Error in POST handler:", error);
      console.error("[generate] Error stack:", error instanceof Error ? (error as Error).stack : undefined);
      
      // Provide more specific error messages
      let errorMessage = "Failed to create job";
      let details = error instanceof Error ? error.message : String(error);
      
      if (details.includes("PayloadTooLargeError") || details.includes("request entity too large")) {
        errorMessage = "File too large";
        details = "The uploaded file exceeds the maximum allowed size. Please use a smaller ZIP file.";
      } else if (details.includes("formData") || details.includes("multipart")) {
        errorMessage = "Invalid file upload";
        details = "Failed to process the uploaded file. Please ensure you're uploading a valid ZIP file.";
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          details,
        },
        { status: 500 }
      );
    }
  } catch (outerError) {
    // Catch any errors that might prevent JSON response (e.g., import errors)
    console.error("[generate] Fatal error:", outerError);
    console.error("[generate] Fatal error stack:", outerError instanceof Error ? (outerError as Error).stack : undefined);
    
    // Return a safe error response
    return NextResponse.json(
      {
        error: "Internal server error",
        details: outerError instanceof Error ? outerError.message : String(outerError),
        hint: "Please ensure the parent project is built: npm run build in product-intelligence-engine directory",
        stack: process.env.NODE_ENV === "development" && outerError instanceof Error ? outerError.stack : undefined,
      },
      { status: 500 }
    );
  }
}

async function processJob(
  jobId: string,
  zipFile: File,
  briefText: string | null,
  briefFiles: File[],
  coreModules: CoreModules
) {
  const {
    unzipRepository,
    extractTier1,
    collectEvidence,
    buildInitialPrdJsonFromTier1,
    runTier2Agent,
    writePrdArtifacts,
  } = coreModules;
    const tmpDir = path.join(process.cwd(), "tmp", "uploads");
    const briefDir = path.join(tmpDir, jobId, "briefs");
    const zipPath = path.join(tmpDir, `${jobId}.zip`);
    const briefFilePaths: string[] = [];

    try {
      // Check if cancelled before starting
      if (isJobCancelled(jobId)) {
        return;
      }

      // Ensure tmp directories exist
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.mkdir(briefDir, { recursive: true });

      // Save uploaded ZIP file
      updateJob(jobId, {
        status: "unzipping",
        progress: 10,
        message: "Saving uploaded file...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      const arrayBuffer = await zipFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(zipPath, buffer);

      // Save brief files if provided
    if (briefFiles && briefFiles.length > 0) {
      updateJob(jobId, {
        status: "unzipping",
        progress: 12,
        message: "Processing brief files...",
      });

      for (let i = 0; i < briefFiles.length; i++) {
        if (isJobCancelled(jobId)) {
          return;
        }

        const briefFile = briefFiles[i];
        const briefFilePath = path.join(briefDir, briefFile.name);
        const briefArrayBuffer = await briefFile.arrayBuffer();
        const briefBuffer = Buffer.from(briefArrayBuffer);
        await fs.writeFile(briefFilePath, briefBuffer);
        briefFilePaths.push(briefFilePath);
      }
    }

    // Step 1: Unzip repository
    updateJob(jobId, {
      status: "unzipping",
      progress: 20,
      message: "Unzipping repository...",
    });

    if (isJobCancelled(jobId)) {
      // Clean up on cancel
      try {
        await fs.unlink(zipPath).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
      return;
    }

    let unzippedPath: string | undefined;

    unzippedPath = await unzipRepository(zipPath);
    let outputDir: string | undefined;
    let projectName: string | undefined;
    let markdownFilename: string | undefined;

    try {
      // Step 2: Extract Tier 1 data
      updateJob(jobId, {
        status: "tier1",
        progress: 40,
        message: "Extracting technical data (Tier 1)...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      const tier1 = await extractTier1(unzippedPath!);
      projectName = tier1.projectName;

      // Step 3: Collect evidence
      updateJob(jobId, {
        status: "tier1",
        progress: 50,
        message: "Collecting evidence...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      const evidence = await collectEvidence(unzippedPath!, {
        briefText: briefText || null,
        briefFiles: briefFilePaths.length > 0 ? briefFilePaths : undefined,
      });

      // Step 4: Build initial PRD JSON
      const baseJson = buildInitialPrdJsonFromTier1(tier1);

      // Step 5: Run Tier 2 agent
      updateJob(jobId, {
        status: "tier2",
        progress: 60,
        message: "Running AI agent (Tier 2)...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      const result = await runTier2Agent(baseJson, evidence, {
        maxQuestions: 7,
      });

      // Step 6: Write artifacts
      updateJob(jobId, {
        status: "generating",
        progress: 80,
        message: "Generating PRD documents...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      outputDir = path.join(process.cwd(), "tmp", "output", jobId);
      const artifacts = await writePrdArtifacts(result.updatedJson, result.questionsForClient, {
        outputDir,
        projectName: tier1.projectName,
      });
      if (!artifacts || !artifacts.markdownFilename) {
        throw new Error("writePrdArtifacts did not return markdown filename");
      }
      markdownFilename = artifacts.markdownFilename;
      console.log(`[generate] PRD artifacts written successfully. Markdown filename: ${markdownFilename}`);

      // Clean up uploaded files
      try {
        await fs.unlink(zipPath);
        // Clean up brief files directory
        if (briefFilePaths.length > 0) {
          await fs.rm(briefDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup errors
      }
    } finally {
      // Always clean up unzipped directory
      if (unzippedPath) {
        try {
          await fs.rm(unzippedPath, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    // Mark as complete (only if not cancelled and all required fields are set)
    if (!isJobCancelled(jobId) && outputDir && markdownFilename) {
      updateJob(jobId, {
        status: "complete",
        progress: 100,
        message: "PRD generated successfully",
        outputDir,
        projectName: projectName || "unknown",
        markdownFilename,
      });
    } else if (!isJobCancelled(jobId) && !markdownFilename) {
      // If we got here without markdownFilename, something went wrong
      updateJob(jobId, {
        status: "error",
        progress: 0,
        message: "Processing failed",
        error: "Failed to generate PRD document. The process completed but no output file was created.",
      });
    }
  } catch (error) {
    // Don't update to error if job was cancelled
    if (!isJobCancelled(jobId)) {
      let errorMessage = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "Processing failed";
      
      // Provide more user-friendly error messages
      if (errorMessage.includes("quota exceeded") || errorMessage.includes("429")) {
        userFriendlyMessage = "OpenAI API quota exceeded";
        errorMessage = "Your OpenAI API key has exceeded its quota. Please check your billing at https://platform.openai.com/account/billing or use a different API key.";
      } else if (errorMessage.includes("authentication") || errorMessage.includes("401")) {
        userFriendlyMessage = "API authentication failed";
        errorMessage = "Invalid OpenAI API key. Please check your .env file and ensure OPENAI_API_KEY is set correctly.";
      } else if (errorMessage.includes("ZIP file not found")) {
        userFriendlyMessage = "File upload failed";
        errorMessage = "The uploaded file could not be processed. Please ensure it's a valid ZIP file.";
      } else if (errorMessage.includes("Failed to extract")) {
        userFriendlyMessage = "File extraction failed";
        errorMessage = "Could not extract the ZIP file. Please ensure it's not corrupted and try again.";
      }
      
      updateJob(jobId, {
        status: "error",
        progress: 0,
        message: userFriendlyMessage,
        error: errorMessage,
        // Clear any partial data that might have been set
        outputDir: undefined,
        projectName: undefined,
        markdownFilename: undefined,
      });
    }

    // Clean up on error
    try {
      await fs.unlink(zipPath).catch(() => {});
      if (briefFilePaths.length > 0) {
        await fs.rm(briefDir, { recursive: true, force: true }).catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

