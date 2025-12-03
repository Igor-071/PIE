import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createJob, updateJob, isJobCancelled } from "@/lib/jobStore";

// Load environment variables from parent directory
const envPath = path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });
console.log(`[generate] Loading env from: ${envPath}`);
console.log(`[generate] OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`);

export async function POST(request: NextRequest) {
  // Ensure we always return JSON, even if there's an unexpected error
  try {
    // Dynamically import core modules at runtime to avoid webpack bundling issues
    let coreModules;
    try {
      console.log("[generate] Loading core modules...");
      // @ts-ignore - webpack alias will resolve this at runtime
      const [
        unzipRepoModule,
        tier1Module,
        evidenceModule,
        mergerModule,
        tier2Module,
        prdModule,
      ] = await Promise.all([
        import("@pie-dist/core/unzipRepo.js"),
        import("@pie-dist/core/tier1Extractor.js"),
        import("@pie-dist/core/evidenceCollector.js"),
        import("@pie-dist/core/jsonMerger.js"),
        import("@pie-dist/core/tier2Agent.js"),
        import("@pie-dist/core/prdGenerator.js"),
      ]);

      coreModules = {
        unzipRepository: unzipRepoModule.unzipRepository,
        extractTier1: tier1Module.extractTier1,
        collectEvidence: evidenceModule.collectEvidence,
        buildInitialPrdJsonFromTier1: mergerModule.buildInitialPrdJsonFromTier1,
        runTier2Agent: tier2Module.runTier2Agent,
        writePrdArtifacts: prdModule.writePrdArtifacts,
      };
      console.log("[generate] Core modules loaded successfully");
    } catch (importError) {
      console.error("[generate] Failed to import core modules:", importError);
      return NextResponse.json(
        {
          error: "Failed to load core modules",
          details: importError instanceof Error ? importError.message : String(importError),
          hint: "Please ensure the parent project is built: npm run build in product-intelligence-engine directory",
        },
        { status: 500 }
      );
    }

    try {
      const formData = await request.formData();
      const zipFile = formData.get("zipFile") as File | null;
      const briefText = formData.get("briefText") as string | null;
      const briefFiles = formData.getAll("briefFiles") as File[];

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

      // Create job
      const jobId = createJob();
      console.log("Created job:", jobId);

      // Process asynchronously with imported modules
      processJob(jobId, zipFile, briefText, briefFiles, coreModules).catch((error) => {
        console.error("[generate] Error in processJob:", error);
        updateJob(jobId, {
          status: "error",
          progress: 0,
          message: "Processing failed",
          error: error instanceof Error ? error.message : String(error),
        });
      });

      return NextResponse.json({
        jobId,
        status: "pending",
        message: "Job created successfully",
      });
    } catch (error) {
      console.error("[generate] Error in POST handler:", error);
      return NextResponse.json(
        {
          error: "Failed to create job",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (outerError) {
    // Catch any errors that might prevent JSON response (e.g., import errors)
    console.error("[generate] Fatal error:", outerError);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: outerError instanceof Error ? outerError.message : String(outerError),
        hint: "Please ensure the parent project is built: npm run build in product-intelligence-engine directory",
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
  coreModules: {
    unzipRepository: typeof import("@pie-dist/core/unzipRepo.js").unzipRepository;
    extractTier1: typeof import("@pie-dist/core/tier1Extractor.js").extractTier1;
    collectEvidence: typeof import("@pie-dist/core/evidenceCollector.js").collectEvidence;
    buildInitialPrdJsonFromTier1: typeof import("@pie-dist/core/jsonMerger.js").buildInitialPrdJsonFromTier1;
    runTier2Agent: typeof import("@pie-dist/core/tier2Agent.js").runTier2Agent;
    writePrdArtifacts: typeof import("@pie-dist/core/prdGenerator.js").writePrdArtifacts;
  }
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
    const briefFilePaths: string[] = [];
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

    const unzippedPath = await unzipRepository(zipPath);

    // Step 2: Extract Tier 1 data
    updateJob(jobId, {
      status: "tier1",
      progress: 40,
      message: "Extracting technical data (Tier 1)...",
    });

    if (isJobCancelled(jobId)) {
      return;
    }

    const tier1 = await extractTier1(unzippedPath);

    // Step 3: Collect evidence
    updateJob(jobId, {
      status: "tier1",
      progress: 50,
      message: "Collecting evidence...",
    });

    if (isJobCancelled(jobId)) {
      return;
    }

    const evidence = await collectEvidence(unzippedPath, {
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

    const outputDir = path.join(process.cwd(), "tmp", "output", jobId);
    await writePrdArtifacts(result.updatedJson, result.questionsForClient, {
      outputDir,
      projectName: tier1.projectName,
    });

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

    // Mark as complete (only if not cancelled)
    if (!isJobCancelled(jobId)) {
      updateJob(jobId, {
        status: "complete",
        progress: 100,
        message: "PRD generated successfully",
        outputDir,
        projectName: tier1.projectName,
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

