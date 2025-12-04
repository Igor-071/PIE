import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    console.log("[progress] API called with jobId:", jobId);

    if (!jobId) {
      console.warn("[progress] Missing jobId parameter");
      return NextResponse.json(
        { 
          error: "jobId parameter is required",
          jobId: null,
          status: "error",
          progress: 0,
          message: "Invalid request: jobId is required"
        },
        { status: 400 }
      );
    }

    const job = getJob(jobId);

    console.log("[progress] Job lookup result:", job ? "found" : "not found", "jobId:", jobId);

    if (!job) {
      console.warn("[progress] Job not found:", jobId);
      return NextResponse.json(
        { 
          error: "Job not found",
          jobId,
          status: "error",
          progress: 0,
          message: `Job ${jobId} not found. It may have expired or been cleared.`
        },
        { status: 404 }
      );
    }

    console.log("[progress] Returning job state:", {
      id: job.id,
      status: job.status,
      progress: job.progress,
    });

    return NextResponse.json(job, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[progress] Error in progress route:", errorMessage);
    if (errorStack) {
      console.error("[progress] Error stack:", errorStack);
    }

    // Always return JSON, even on unexpected errors
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        status: "error",
        progress: 0,
        message: "An unexpected error occurred while fetching job progress"
      },
      { status: 500 }
    );
  }
}

