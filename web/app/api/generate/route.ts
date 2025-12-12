import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createJob, updateJob, isJobCancelled, addStep, updateActiveStep, getJob } from "@/lib/jobStore";
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
      const prototypeUrls = formData.getAll("prototypeUrls") as string[];

      console.log(`[generate] ZIP file: ${zipFile ? `${zipFile.name} (${zipFile.size} bytes)` : 'none'}`);
      console.log(`[generate] Brief text: ${briefText ? briefText.length + ' chars' : 'none'}`);
      console.log(`[generate] Brief files: ${briefFiles.length}`);
      console.log(`[generate] Prototype URLs: ${prototypeUrls.length}`);

      // Validate and normalize URLs (up to 3)
      const { validateUrls } = await import("@/lib/urlEvidence");
      const validUrls = validateUrls(prototypeUrls, 3);
      
      console.log(`[generate] Valid URLs after validation: ${validUrls.length}`);

      // Either ZIP file or URLs must be provided
      if (!zipFile && validUrls.length === 0) {
        return NextResponse.json(
          { error: "Either a ZIP file or prototype URLs (up to 3) must be provided" },
          { status: 400 }
        );
      }

      // Validate ZIP file type and size (if provided)
      const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
      const MAX_BRIEF_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (zipFile) {
        if (!zipFile.name.toLowerCase().endsWith(".zip")) {
          return NextResponse.json(
            { error: "File must be a ZIP archive" },
            { status: 400 }
          );
        }

        if (zipFile.size > MAX_ZIP_SIZE) {
          return NextResponse.json(
            { error: `ZIP file size exceeds maximum allowed size of ${MAX_ZIP_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3547cde9-a9d2-4669-a991-f1254aa07bed',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          sessionId:'debug-session',
          runId:'pre-fix',
          hypothesisId:'H2',
          location:'web/app/api/generate/route.ts:114',
          message:'generate POST job created',
          data:{
            jobId,
            hasZipFile: !!zipFile,
            briefFilesCount: briefFiles.length
          },
          timestamp:Date.now()
        })
      }).catch(()=>{});
      try {
        const payload = {
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'web/app/api/generate/route.ts:114',
          message: 'generate POST job created (fs)',
          data: {
            jobId,
            hasZipFile: !!zipFile,
            briefFilesCount: briefFiles.length
          },
          timestamp: Date.now()
        };
        await fs.appendFile("/Users/igorkriasnik/work/PIE/.cursor/debug.log", JSON.stringify(payload) + "\n");
      } catch {
        // Swallow logging errors
      }
      // #endregion

      // Process asynchronously with imported modules
      // Use setImmediate to ensure the response is sent before processing starts
      setImmediate(() => {
        processJob(jobId, zipFile, briefText, briefFiles, validUrls, coreModules).catch((error) => {
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
  zipFile: File | null,
  briefText: string | null,
  briefFiles: File[],
  prototypeUrls: string[],
  coreModules: CoreModules
) {
    const {
    unzipRepository,
    extractTier1,
    collectEvidence,
    buildInitialPrdJsonFromTier1,
    runTier2Agent,
    runTier3Agent,
    writePrdArtifacts,
    validatePrd,
  } = coreModules;
    const tmpDir = path.join(process.cwd(), "tmp", "uploads");
    const briefDir = path.join(tmpDir, jobId, "briefs");
    const zipPath = zipFile ? path.join(tmpDir, `${jobId}.zip`) : null;
    const briefFilePaths: string[] = [];
    
    // Determine processing mode
    const hasZip = !!zipFile;
    const hasUrls = prototypeUrls.length > 0;
    console.log(`[processJob] Mode: ZIP=${hasZip}, URLs=${hasUrls} (${prototypeUrls.length})`);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/3547cde9-a9d2-4669-a991-f1254aa07bed',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          sessionId:'debug-session',
          runId:'pre-fix',
          hypothesisId:'H2',
          location:'web/app/api/generate/route.ts:202',
          message:'processJob start',
          data:{
            jobId,
            zipPath,
            briefFilesCount: briefFiles.length
          },
          timestamp:Date.now()
        })
      }).catch(()=>{});
      try {
        const payload = {
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'web/app/api/generate/route.ts:202',
          message: 'processJob start (fs)',
          data: {
            jobId,
            zipPath,
            briefFilesCount: briefFiles.length
          },
          timestamp: Date.now()
        };
        await fs.appendFile("/Users/igorkriasnik/work/PIE/.cursor/debug.log", JSON.stringify(payload) + "\n");
      } catch {
        // Swallow logging errors
      }
      // #endregion
      // Check if cancelled before starting
      if (isJobCancelled(jobId)) {
        return;
      }

      // Ensure tmp directories exist
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.mkdir(briefDir, { recursive: true });

      // Save uploaded ZIP file (if provided)
      if (hasZip && zipFile && zipPath) {
        addStep(jobId, "Saving uploaded file...", "active");
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
        addStep(jobId, "Uploaded file saved", "completed");
      }

      // Save brief files if provided
    if (briefFiles && briefFiles.length > 0) {
      addStep(jobId, `Processing ${briefFiles.length} brief file${briefFiles.length > 1 ? 's' : ''}...`, "active");
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
      addStep(jobId, `Processed ${briefFiles.length} brief file${briefFiles.length > 1 ? 's' : ''}`, "completed");
    }

    // Step 1: Unzip repository (if ZIP provided)
    let unzippedPath: string | undefined;
    
    if (hasZip && zipPath) {
      addStep(jobId, "Unzipping repository...", "active");
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

      unzippedPath = await unzipRepository(zipPath);
      addStep(jobId, "Repository unzipped successfully", "completed");
    }
    
    let outputDir: string | undefined;
    let projectName: string | undefined;
    let markdownFilename: string | undefined;
    let totalTokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let tokenUsageByPhase: Array<{ phase: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> = [];
    let validationResult: any = null;

    try {
      // Step 2: Extract Tier 1 data (if ZIP provided) or build minimal Tier1 from URLs
      let tier1: any;
      
      if (hasZip && unzippedPath) {
        addStep(jobId, "Extracting technical data (Tier 1)...", "active");
        updateJob(jobId, {
          status: "tier1",
          progress: 40,
          message: "Extracting technical data (Tier 1)...",
        });

        if (isJobCancelled(jobId)) {
          return;
        }

        tier1 = await extractTier1(unzippedPath);
        projectName = tier1.projectName;
        
        addStep(jobId, "Technical data extracted (screens, APIs, data models)", "completed");
      } else {
        // URLs-only mode: build minimal Tier1 from URLs
        addStep(jobId, "Building project structure from URLs...", "active");
        updateJob(jobId, {
          status: "tier1",
          progress: 40,
          message: "Analyzing prototype URLs...",
        });

        if (isJobCancelled(jobId)) {
          return;
        }

        // Extract domain/hostname for project name
        try {
          const firstUrl = new URL(prototypeUrls[0]);
          projectName = firstUrl.hostname.replace(/^www\./, '').replace(/\.[^.]+$/, '');
        } catch {
          projectName = 'prototype-project';
        }

        // Build minimal Tier1 structure
        // Note: navigation must be an array of Navigation objects, not an object with routes
        tier1 = {
          projectName,
          screens: prototypeUrls.map((url, idx) => ({
            id: `screen-${idx}`,
            name: `Screen ${idx + 1}`,
            path: url,
            type: 'web-page',
          })),
          apis: [],
          apiEndpoints: [],
          dataModels: {},
          statePatterns: [],
          events: [],
          navigation: [], // Empty array - URLs don't provide navigation relationships
          aiMetadata: {
            analysisTimestamp: new Date().toISOString(),
            repositoryStructure: {
              totalFiles: prototypeUrls.length,
              frameworks: ['web'],
            },
          },
        };
        
        addStep(jobId, `Project structure created (${prototypeUrls.length} prototype page${prototypeUrls.length > 1 ? 's' : ''})`, "completed");
      }

      // Step 3: Collect evidence from repository and/or URLs
      let repoEvidenceTier2: any[] = [];
      let repoEvidenceTier3: any[] = [];
      let urlEvidence: any[] = [];
      let evidenceTier2: any[] = [];
      let evidenceTier3: any[] = [];
      
      if (hasZip && unzippedPath) {
        addStep(jobId, "Collecting evidence from repository...", "active");
        updateJob(jobId, {
          status: "tier1",
          progress: 50,
          message: "Collecting evidence from repository...",
        });

        if (isJobCancelled(jobId)) {
          return;
        }

        // Collect evidence in Tier 2 mode (business-focused, excludes technical details)
        repoEvidenceTier2 = await collectEvidence(unzippedPath, {
          briefText: briefText || null,
          briefFiles: briefFilePaths.length > 0 ? briefFilePaths : undefined,
          mode: "tier2", // Use Tier 2 mode for business strategy analysis
        }, tier1);
        addStep(jobId, `Collected ${repoEvidenceTier2.length} evidence document${repoEvidenceTier2.length !== 1 ? 's' : ''} from repository (Tier 2 set)`, "completed");
      }
      
      // Collect evidence from prototype URLs (if provided)
      if (hasUrls) {
        addStep(jobId, `Fetching prototype URLs (${prototypeUrls.length})...`, "active");
        updateJob(jobId, {
          status: "tier1",
          progress: hasZip ? 55 : 50,
          message: "Fetching prototype URLs...",
        });

        if (isJobCancelled(jobId)) {
          return;
        }

        const { collectUrlEvidence } = await import("@/lib/urlEvidence");
        urlEvidence = await collectUrlEvidence(prototypeUrls, {
          timeout: 10000,
          maxContentSize: 2 * 1024 * 1024,
          maxPages: 10,
          renderJavascript: true,
        });
        
        addStep(jobId, `Collected ${urlEvidence.length} evidence document${urlEvidence.length !== 1 ? 's' : ''} from URLs`, "completed");
      }
      
      // Build Tier 2 evidence (smaller) and Tier 3 evidence (richer) to improve PRD quality without inflating Tier 2 tokens.
      evidenceTier2 = [...repoEvidenceTier2, ...urlEvidence];
      if (hasZip && unzippedPath) {
        // Tier 3 set includes technical evidence (tests/config/components/patterns) for more precise requirements.
        repoEvidenceTier3 = await collectEvidence(unzippedPath, {
          briefText: briefText || null,
          briefFiles: briefFilePaths.length > 0 ? briefFilePaths : undefined,
          mode: "tier3",
        }, tier1);
      }
      evidenceTier3 = [...repoEvidenceTier3, ...urlEvidence];

      console.log(`[processJob] Evidence documents: tier2=${evidenceTier2.length}, tier3=${evidenceTier3.length}`);

      // Step 4: Build initial PRD JSON
      addStep(jobId, "Building initial PRD structure...", "active");
      
      const baseJson = buildInitialPrdJsonFromTier1(tier1);
      
      addStep(jobId, "Initial PRD structure created", "completed");

      // Step 5: Run Tier 2 agent
      addStep(jobId, "Running AI analysis (Tier 2: Business Strategy)...", "active");
      updateJob(jobId, {
        status: "tier2",
        progress: 50,
        message: "Running AI agent (Tier 2)...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      let lastTier2Message = "";
      
      const tier2Result = await runTier2Agent(baseJson, evidenceTier2, {
        maxQuestions: 7,
        onProgress: (progress: number, message: string) => {
          if (!isJobCancelled(jobId)) {
            // Create a new step if message changed significantly
            if (message !== lastTier2Message && lastTier2Message !== "") {
              addStep(jobId, message, "active", progress);
            } else if (lastTier2Message === "") {
              // First progress update - update the existing step
              updateActiveStep(jobId, progress, message);
            } else {
              // Same message, just update progress
              updateActiveStep(jobId, progress);
            }
            lastTier2Message = message;
            updateJob(jobId, {
              status: "tier2",
              progress,
              message,
            });
          }
        },
      });
      addStep(jobId, "Tier 2 analysis complete (business strategy, target audience)", "completed");

      // Step 6: Run Tier 3 agent
      addStep(jobId, "Running Tier 3 agent (detailed requirements)...", "active");
      updateJob(jobId, {
        status: "tier3",
        progress: 70,
        message: "Running Tier 3 agent (detailed sections)...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      let lastTier3Message = "";
      const tier3Result = await runTier3Agent(tier2Result.updatedJson, evidenceTier3, tier1, {
        onProgress: (progress: number, message: string) => {
          if (!isJobCancelled(jobId)) {
            // Create a new step if message changed significantly (new prompt being executed)
            if (message !== lastTier3Message && lastTier3Message !== "") {
              addStep(jobId, message, "active", progress);
            } else if (lastTier3Message === "") {
              // First progress update - update the existing step
              updateActiveStep(jobId, progress, message);
            } else {
              // Same message, just update progress
              updateActiveStep(jobId, progress);
            }
            lastTier3Message = message;
            updateJob(jobId, {
              status: "tier3",
              progress,
              message,
            });
          }
        },
      });
      addStep(jobId, "Tier 3 analysis complete (assumptions, dependencies, requirements)", "completed");

      // Step 7: Merge questions from Tier 2 and Tier 3
      addStep(jobId, "Merging questions from analysis...", "active");
      const allQuestions = {
        questions: [
          ...tier2Result.questionsForClient.questions,
          ...tier3Result.questions.questions,
        ],
        generatedAt: new Date().toISOString(),
      };
      addStep(jobId, `Merged ${allQuestions.questions.length} question${allQuestions.questions.length !== 1 ? 's' : ''}`, "completed");

      // Step 8: Write artifacts
      addStep(jobId, "Generating PRD documents (JSON and Markdown)...", "active");
      updateJob(jobId, {
        status: "generating",
        progress: 90,
        message: "Generating PRD documents...",
      });

      if (isJobCancelled(jobId)) {
        return;
      }

      outputDir = path.join(process.cwd(), "tmp", "output", jobId);
      const artifacts = await writePrdArtifacts(tier3Result.updatedJson, allQuestions, {
        outputDir,
        projectName: tier1.projectName,
      });
      if (!artifacts || !artifacts.markdownFilename) {
        throw new Error("writePrdArtifacts did not return markdown filename");
      }
      markdownFilename = artifacts.markdownFilename;
      addStep(jobId, "PRD documents generated successfully", "completed");
      console.log(`[generate] PRD artifacts written successfully. Markdown filename: ${markdownFilename}`);

      // Step 9: Validate PRD and track token usage
      addStep(jobId, "Validating PRD and tracking token usage...", "active");
      validationResult = validatePrd(tier3Result.updatedJson);
      
      // Aggregate token usage from Tier 2 and Tier 3
      tokenUsageByPhase = [];
      
      if (tier2Result.tokenUsage) {
        tokenUsageByPhase.push({
          phase: "Tier 2 (Business Strategy)",
          usage: tier2Result.tokenUsage,
        });
      }
      
      if (tier3Result.tokenUsage) {
        tokenUsageByPhase.push({
          phase: "Tier 3 (Detailed Requirements)",
          usage: tier3Result.tokenUsage,
        });
      }

      totalTokenUsage = tokenUsageByPhase.reduce(
        (acc, phase) => ({
          promptTokens: acc.promptTokens + phase.usage.promptTokens,
          completionTokens: acc.completionTokens + phase.usage.completionTokens,
          totalTokens: acc.totalTokens + phase.usage.totalTokens,
        }),
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      );

      if (totalTokenUsage.totalTokens > 0) {
        console.log(`[generate] Total token usage: ${totalTokenUsage.totalTokens} tokens`);
        console.log(`[generate] Token usage by phase:`, tokenUsageByPhase.map(p => `${p.phase}: ${p.usage.totalTokens}`).join(", "));
      }

      addStep(jobId, `Validation complete: ${validationResult.isValid ? "Valid" : "Issues found"} (Score: ${validationResult.score}/100)`, "completed");

      // Clean up uploaded files
      try {
        if (zipPath) {
          await fs.unlink(zipPath);
        }
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
      addStep(jobId, "PRD generation complete!", "completed");
      
      updateJob(jobId, {
        status: "complete",
        progress: 100,
        message: "PRD generated successfully",
        outputDir,
        projectName: projectName || "unknown",
        markdownFilename,
        tokenUsage: totalTokenUsage.totalTokens > 0 ? {
          total: totalTokenUsage,
          byPhase: tokenUsageByPhase,
        } : undefined,
        validationResult: validationResult ? {
          isValid: validationResult.isValid,
          score: validationResult.score,
          errors: validationResult.errors.length,
          warnings: validationResult.warnings.length,
        } : undefined,
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
      if (zipPath) {
        await fs.unlink(zipPath).catch(() => {});
      }
      if (briefFilePaths.length > 0) {
        await fs.rm(briefDir, { recursive: true, force: true }).catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

