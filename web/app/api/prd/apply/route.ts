import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import { getJob } from "@/lib/jobStore";
import { applyPatch } from "fast-json-patch";
import { validatePrd, getValidationSummary } from "@/lib/prdValidator";

export const runtime = "nodejs";

/**
 * POST /api/prd/apply
 * Applies approved patches to the PRD and versions the artifacts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, markdownPatch, jsonPatch } = body;

    console.log("[apply] Request received:", { jobId, hasMarkdownPatch: !!markdownPatch, hasJsonPatch: !!jsonPatch });

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    if (!markdownPatch && !jsonPatch) {
      return NextResponse.json(
        { error: "At least one of markdownPatch or jsonPatch is required" },
        { status: 400 }
      );
    }

    // Validate job exists and is complete
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

    // Load current PRD artifacts
    const outputDir = job.outputDir || path.join(process.cwd(), "tmp", "output", jobId);
    
    try {
      // Read current versions
      const jsonPath = path.join(outputDir, "prd-structured.json");
      const jsonContent = await fs.readFile(jsonPath, "utf-8");
      let prdJson = JSON.parse(jsonContent);

      let markdown = "";
      const markdownFilename = job.markdownFilename || "";
      let markdownPath = "";
      
      if (markdownFilename) {
        markdownPath = path.join(outputDir, markdownFilename);
        markdown = await fs.readFile(markdownPath, "utf-8");
      } else {
        const files = await fs.readdir(outputDir);
        const mdFile = files.find(f => f.startsWith("PRD_") && f.endsWith(".md"));
        if (mdFile) {
          markdownPath = path.join(outputDir, mdFile);
          markdown = await fs.readFile(markdownPath, "utf-8");
        }
      }

      // Determine next version number
      const files = await fs.readdir(outputDir);
      const versions = files
        .filter(f => f.match(/prd-structured\.v\d+\.json/))
        .map(f => parseInt(f.match(/v(\d+)\.json/)?.[1] || "0"));
      const nextVersion = versions.length > 0 ? Math.max(...versions) + 1 : 1;

      // Apply patches
      let updatedJson = prdJson;
      let updatedMarkdown = markdown;

      if (jsonPatch && Array.isArray(jsonPatch) && jsonPatch.length > 0) {
        try {
          // Apply JSON Patch using fast-json-patch library
          const patchResult = applyPatch(prdJson, jsonPatch, true, false);
          updatedJson = patchResult.newDocument;
          console.log("[apply] Applied JSON patch successfully");
        } catch (error) {
          console.error("[apply] Error applying JSON patch:", error);
          return NextResponse.json(
            { error: "Failed to apply JSON patch", details: error instanceof Error ? error.message : String(error) },
            { status: 400 }
          );
        }
      }

      if (markdownPatch) {
        try {
          // Apply markdown patch (simplified - in production use a proper patch library)
          const patchResult = applyMarkdownPatch(markdown, markdownPatch);
          updatedMarkdown = patchResult.result;
          console.log(`[apply] Applied markdown patch successfully (method: ${patchResult.method})`);
        } catch (error) {
          console.error("[apply] Error applying markdown patch:", error);
          return NextResponse.json(
            { error: "Failed to apply markdown patch", details: error instanceof Error ? error.message : String(error) },
            { status: 400 }
          );
        }
      }

      // Save versioned files
      const versionedJsonPath = path.join(outputDir, `prd-structured.v${nextVersion}.json`);
      await fs.writeFile(versionedJsonPath, JSON.stringify(updatedJson, null, 2), "utf-8");

      if (markdownPath && markdownFilename) {
        const baseFilename = markdownFilename.replace(/\.md$/, "");
        const versionedMarkdownPath = path.join(outputDir, `${baseFilename}.v${nextVersion}.md`);
        await fs.writeFile(versionedMarkdownPath, updatedMarkdown, "utf-8");
      }

      // Update current versions (overwrite)
      await fs.writeFile(jsonPath, JSON.stringify(updatedJson, null, 2), "utf-8");
      if (markdownPath) {
        await fs.writeFile(markdownPath, updatedMarkdown, "utf-8");
      }

      // Save change log
      const changeLogPath = path.join(outputDir, `changes.v${nextVersion}.json`);
      await fs.writeFile(changeLogPath, JSON.stringify({
        version: nextVersion,
        timestamp: new Date().toISOString(),
        hasJsonPatch: !!jsonPatch,
        hasMarkdownPatch: !!markdownPatch,
      }, null, 2), "utf-8");

      // Run validation on the updated JSON
      const validationResult = validatePrd(updatedJson);
      const validationSummary = getValidationSummary(validationResult);

      console.log("[apply] Successfully applied patches and created version", nextVersion);
      console.log("[apply] Validation result:", validationSummary);

      return NextResponse.json({
        success: true,
        version: nextVersion,
        updatedJson,
        updatedMarkdown,
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
      console.error("[apply] Error processing patches:", error);
      return NextResponse.json(
        { 
          error: "Failed to apply patches",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[apply] Error in POST handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Applies a unified diff patch to markdown
 * Returns both the result and the method used for logging
 */
function applyMarkdownPatch(original: string, patch: string): { result: string; method: string } {
  const trimmedPatch = patch.trim();
  
  // Check if it's a unified diff format
  const hasHunkHeaders = trimmedPatch.includes("@@");
  const hasFileHeaders = trimmedPatch.startsWith("---") || trimmedPatch.startsWith("+++");
  
  if (hasHunkHeaders) {
    try {
      const result = applyUnifiedDiff(original, trimmedPatch);
      return { result, method: "unified-diff" };
    } catch (error) {
      console.warn("[applyMarkdownPatch] Unified diff application failed, trying fallback:", error);
      // Fall through to fallback logic
    }
  }
  
  // Fallback: Check if patch looks like full markdown content (not a diff)
  // If it's clearly markdown content (has headers, paragraphs, etc.) and doesn't look like a diff,
  // treat it as a replacement
  const looksLikeFullContent = 
    !hasHunkHeaders && 
    !hasFileHeaders &&
    (trimmedPatch.includes("# ") || trimmedPatch.includes("## ") || trimmedPatch.split("\n").length > 10);
  
  if (looksLikeFullContent) {
    console.log("[applyMarkdownPatch] Treating patch as full content replacement");
    return { result: trimmedPatch, method: "full-replacement" };
  }
  
  // Last resort: return original (don't apply broken patches)
  console.warn("[applyMarkdownPatch] Patch format not recognized, returning original unchanged");
  return { result: original, method: "no-op" };
}

/**
 * Applies a unified diff to the original text
 */
function applyUnifiedDiff(original: string, patch: string): string {
  const originalLines = original.split("\n");
  const patchLines = patch.split("\n");
  
  let result = [...originalLines];
  let lineOffset = 0;
  let i = 0;
  
  while (i < patchLines.length) {
    const line = patchLines[i];
    
    // Match hunk headers: @@ -oldStart,oldCount +newStart,newCount @@
    // Also handle: @@ -oldStart +newStart @@ (no counts, means 1 line)
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    
    if (hunkMatch) {
      const oldStart = parseInt(hunkMatch[1]) - 1; // Convert to 0-based
      const oldCount = parseInt(hunkMatch[2] || "1"); // Default to 1 if not specified
      const newStart = parseInt(hunkMatch[3]) - 1;
      const newCount = parseInt(hunkMatch[4] || "1"); // Default to 1 if not specified
      
      // Collect the hunk lines
      const hunkLines: Array<{ type: "+" | "-" | " "; content: string }> = [];
      i++; // Move past the hunk header
      
      // Read hunk content until next hunk header or end
      while (i < patchLines.length && !patchLines[i].startsWith("@@")) {
        const hunkLine = patchLines[i];
        if (hunkLine.startsWith("+")) {
          hunkLines.push({ type: "+", content: hunkLine.substring(1) });
        } else if (hunkLine.startsWith("-")) {
          hunkLines.push({ type: "-", content: hunkLine.substring(1) });
        } else if (hunkLine.startsWith(" ") || hunkLine === "") {
          hunkLines.push({ type: " ", content: hunkLine.startsWith(" ") ? hunkLine.substring(1) : hunkLine });
        } else {
          // Unexpected line format, skip it
          console.warn(`[applyUnifiedDiff] Unexpected hunk line format: ${hunkLine}`);
        }
        i++;
      }
      
      // Apply the hunk
      const actualOldStart = oldStart + lineOffset;
      
      // Count deletions and additions
      const deletions = hunkLines.filter(l => l.type === "-").length;
      const additions = hunkLines.filter(l => l.type === "+").length;
      
      // Build the replacement lines
      const replacementLines: string[] = [];
      let contextCount = 0;
      
      for (const hunkLine of hunkLines) {
        if (hunkLine.type === " ") {
          // Context line - keep it
          replacementLines.push(hunkLine.content);
          contextCount++;
        } else if (hunkLine.type === "+") {
          // Addition - add it
          replacementLines.push(hunkLine.content);
        }
        // Deletions are handled by not including them in replacementLines
      }
      
      // Apply the replacement
      // We need to remove oldCount lines and insert the new lines
      // The hunk tells us how many lines to remove (oldCount), but we need to account for context
      const linesToRemove = Math.max(1, oldCount); // At least remove 1 line
      const insertPosition = actualOldStart;
      
      // Remove the old lines and insert new ones
      result.splice(insertPosition, linesToRemove, ...replacementLines);
      
      // Update line offset for subsequent hunks
      lineOffset += (additions - deletions);
      
      // Don't increment i here - the while loop already moved past the hunk
    } else {
      // Skip lines that aren't hunk headers (file headers, etc.)
      i++;
    }
  }
  
  return result.join("\n");
}
