import { NextRequest, NextResponse } from "next/server";
import { cancelJob } from "@/lib/jobStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    const cancelled = cancelJob(jobId);

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: "Job cancelled successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Job not found or cannot be cancelled" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel job",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

