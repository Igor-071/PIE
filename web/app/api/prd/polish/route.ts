import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import { getJob } from "@/lib/jobStore";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes for polish requests

// Load environment variables from parent directory
const envPath = path.join(process.cwd(), "..", ".env");
dotenv.config({ path: envPath });

/**
 * POST /api/prd/polish
 * Generates proposed edits to the PRD based on user request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, message, scope } = body;

    console.log("[polish] Request received:", { jobId, message, scope });

    if (!jobId || !message) {
      return NextResponse.json(
        { error: "jobId and message are required" },
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

    // Load PRD artifacts
    const outputDir = job.outputDir || path.join(process.cwd(), "tmp", "output", jobId);
    
    let prdJson: any;
    let markdown: string;

    try {
      const jsonPath = path.join(outputDir, "prd-structured.json");
      const jsonContent = await fs.readFile(jsonPath, "utf-8");
      prdJson = JSON.parse(jsonContent);

      const markdownFilename = job.markdownFilename || "";
      if (markdownFilename) {
        const markdownPath = path.join(outputDir, markdownFilename);
        markdown = await fs.readFile(markdownPath, "utf-8");
      } else {
        const files = await fs.readdir(outputDir);
        const mdFile = files.find(f => f.startsWith("PRD_") && f.endsWith(".md"));
        if (mdFile) {
          const markdownPath = path.join(outputDir, mdFile);
          markdown = await fs.readFile(markdownPath, "utf-8");
        } else {
          markdown = "";
        }
      }
    } catch (error) {
      console.error("[polish] Error loading PRD artifacts:", error);
      return NextResponse.json(
        { error: "Failed to load PRD artifacts" },
        { status: 500 }
      );
    }

    // Call OpenAI to generate proposed edits
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 90000, // 90 seconds
    });

    const systemPrompt = `You are a PRD polish assistant. Given a Product Requirements Document (PRD) and a user request, generate proposed improvements.

IMPORTANT RULES:
1. NEVER fabricate facts, features, or requirements that aren't in the original PRD
2. If you need information to fulfill the request, ask follow-up questions instead
3. Focus on improving clarity, structure, and testability
4. Preserve all technical details and structured data
5. Only edit narrative/prose sections unless explicitly asked to change structured data

Return JSON with:
- assistantMessage: brief explanation of what you're proposing (2-3 sentences)
- markdownPatch: unified diff format showing proposed markdown changes (optional if no narrative changes)
- jsonPatch: RFC6902 JSON Patch operations for structured data changes (optional if no JSON changes)
- followUpQuestions: list of questions if you need more information (optional)

Current PRD context:
- Project: ${prdJson.project?.name || "Unknown"}
- Screens: ${prdJson.screens?.length || 0}
- API endpoints: ${prdJson.api?.length || 0}
- Has acceptance criteria: ${!!prdJson.productRequirements?.length}`;

    const userPrompt = `User request: "${message}"

Current PRD JSON (excerpt - structured data):
${JSON.stringify({
  project: prdJson.project,
  executiveSummary: prdJson.executiveSummary,
  screens: prdJson.screens?.slice(0, 5),
  api: prdJson.api?.slice(0, 5),
  productRequirements: prdJson.productRequirements?.slice(0, 3),
}, null, 2)}

Current PRD Markdown (first 2000 chars):
${markdown.substring(0, 2000)}

Generate proposed improvements based on the user's request.`;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(responseContent);

      // Validate result structure
      if (!result.assistantMessage) {
        result.assistantMessage = "I've prepared some proposed changes for review.";
      }

      console.log("[polish] Generated proposal successfully");

      return NextResponse.json({
        assistantMessage: result.assistantMessage,
        markdownPatch: result.markdownPatch || null,
        jsonPatch: result.jsonPatch || null,
        followUpQuestions: result.followUpQuestions || [],
      });

    } catch (error) {
      console.error("[polish] OpenAI error:", error);
      return NextResponse.json(
        { 
          error: "Failed to generate proposal",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[polish] Error in POST handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
