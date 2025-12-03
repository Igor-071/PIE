import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
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
    // Use absolute file paths - Node.js supports absolute paths in dynamic imports
    let coreModules;
    try {
      console.log("[generate] Loading core modules...");
      // More reliable path resolution: go up from web directory to product-intelligence-engine, then to dist
      const currentDir = process.cwd();
      // If we're in web directory, go up one level; otherwise assume we're already in product-intelligence-engine
      const baseDir = currentDir.endsWith("/web") || currentDir.endsWith("\\web") 
        ? path.resolve(currentDir, "..")
        : currentDir;
      const distPath = path.resolve(baseDir, "dist");
      console.log(`[generate] Current dir: ${currentDir}`);
      console.log(`[generate] Base dir: ${baseDir}`);
      console.log(`[generate] Dist path: ${distPath}`);
      
      // Verify dist directory exists
      try {
        await fs.access(distPath);
      } catch {
        throw new Error(`Dist directory not found at: ${distPath}. Please run 'npm run build' in the product-intelligence-engine directory.`);
      }
      
      // Convert absolute paths to file:// URLs for dynamic imports
      const unzipRepoPath = pathToFileURL(path.join(distPath, "core", "unzipRepo.js")).href;
      const tier1Path = pathToFileURL(path.join(distPath, "core", "tier1Extractor.js")).href;
      const evidencePath = pathToFileURL(path.join(distPath, "core", "evidenceCollector.js")).href;
      const mergerPath = pathToFileURL(path.join(distPath, "core", "jsonMerger.js")).href;
      const tier2Path = pathToFileURL(path.join(distPath, "core", "tier2Agent.js")).href;
      const prdPath = pathToFileURL(path.join(distPath, "core", "prdGenerator.js")).href;
      
      // Verify files exist before importing
      const filesToCheck = [
        { name: "unzipRepo.js", path: path.join(distPath, "core", "unzipRepo.js") },
        { name: "tier1Extractor.js", path: path.join(distPath, "core", "tier1Extractor.js") },
        { name: "evidenceCollector.js", path: path.join(distPath, "core", "evidenceCollector.js") },
        { name: "jsonMerger.js", path: path.join(distPath, "core", "jsonMerger.js") },
        { name: "tier2Agent.js", path: path.join(distPath, "core", "tier2Agent.js") },
        { name: "prdGenerator.js", path: path.join(distPath, "core", "prdGenerator.js") },
      ];
      
      for (const file of filesToCheck) {
        try {
          await fs.access(file.path);
        } catch {
          throw new Error(`Required module file not found: ${file.name} at ${file.path}. Please run 'npm run build' in the product-intelligence-engine directory.`);
        }
      }
      
      console.log(`[generate] Importing from: ${unzipRepoPath}`);
      
      const [
        unzipRepoModule,
        tier1Module,
        evidenceModule,
        mergerModule,
        tier2Module,
        prdModule,
      ] = await Promise.all([
        import(unzipRepoPath),
        import(tier1Path),
        import(evidencePath),
        import(mergerPath),
        import(tier2Path),
        import(prdPath),
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
      const errorMessage = importError instanceof Error ? importError.message : String(importError);
      const errorStack = importError instanceof Error ? importError.stack : undefined;
      console.error("[generate] Error stack:", errorStack);
      
      // Provide more helpful error messages
      let userMessage = "Failed to load core modules";
      let hint = "Please ensure the parent project is built: npm run build in product-intelligence-engine directory";
      
      if (errorMessage.includes("Cannot find module") || errorMessage.includes("not found")) {
        userMessage = "Core modules not found. The project needs to be built.";
        hint = "Run 'cd product-intelligence-engine && npm run build' to compile the core modules.";
      } else if (errorMessage.includes("dist directory")) {
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

// Type definitions for core modules (avoiding TypeScript resolution issues with dynamic imports)
interface CoreModules {
  unzipRepository: (zipPath: string) => Promise<string>;
  extractTier1: (repoPath: string) => Promise<any>;
  collectEvidence: (repoPath: string, options?: any) => Promise<any[]>;
  buildInitialPrdJsonFromTier1: (tier1: any) => any;
  runTier2Agent: (baseJson: any, evidence: any[], options?: any) => Promise<any>;
  writePrdArtifacts: (prd: any, questions: any, options: any) => Promise<void>;
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

    // Mark as complete (only if not cancelled and outputDir was set)
    if (!isJobCancelled(jobId) && outputDir) {
      updateJob(jobId, {
        status: "complete",
        progress: 100,
        message: "PRD generated successfully",
        outputDir,
        projectName: projectName || "unknown",
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

