// In-memory job status store
// In production, this should be replaced with Redis or a database

export type JobStatus = 
  | "pending"
  | "unzipping"
  | "tier1"
  | "tier2"
  | "tier3"
  | "generating"
  | "complete"
  | "error"
  | "cancelled";

export interface Step {
  id: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'active' | 'completed';
  progress?: number; // Optional progress for active steps
}

export interface JobState {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  message: string;
  error?: string;
  outputDir?: string;
  projectName?: string;
  markdownFilename?: string;
  cancelled?: boolean;
  createdAt: number; // Timestamp when job was created
  steps?: Step[]; // Detailed step tracking
}

// Use a global Map to ensure persistence across API route calls
// In Next.js, this will persist as long as the server instance is running
// Using globalThis to ensure it persists across module reloads in development
const globalJobs = (globalThis as any).__pie_jobStore || new Map<string, JobState>();
if (!(globalThis as any).__pie_jobStore) {
  (globalThis as any).__pie_jobStore = globalJobs;
}
const jobs = globalJobs;

export function createJob(): string {
  const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();
  const jobState: JobState = {
    id,
    status: "pending",
    progress: 0,
    message: "Job created",
    createdAt,
    steps: [],
  };
  jobs.set(id, jobState);
  console.log(`[jobStore] Created job ${id}, total jobs: ${jobs.size}`);
  return id;
}

export function getJob(id: string): JobState | undefined {
  const job = jobs.get(id);
  console.log(`[jobStore] Getting job ${id}, found: ${!!job}, total jobs: ${jobs.size}`);
  if (!job) {
    console.log(`[jobStore] Available job IDs:`, Array.from(jobs.keys()));
  }
  return job;
}

export function updateJob(
  id: string,
  updates: Partial<Omit<JobState, "id">>
): void {
  const job = jobs.get(id);
  if (job) {
    jobs.set(id, { ...job, ...updates });
  }
}

/**
 * Adds a new step to the job's step tracking
 */
export function addStep(
  id: string,
  message: string,
  status: Step['status'] = 'active',
  progress?: number
): void {
  const job = jobs.get(id);
  if (job) {
    const steps = job.steps || [];
    const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newStep: Step = {
      id: stepId,
      message,
      timestamp: Date.now(),
      status,
      progress,
    };
    
    // Mark previous active step as completed if there is one
    const updatedSteps = steps.map(step => 
      step.status === 'active' ? { ...step, status: 'completed' as const } : step
    );
    
    updatedSteps.push(newStep);
    jobs.set(id, { ...job, steps: updatedSteps });
  }
}

/**
 * Updates the current active step's progress
 */
export function updateActiveStep(
  id: string,
  progress: number,
  message?: string
): void {
  const job = jobs.get(id);
  if (job && job.steps) {
    const steps = [...job.steps];
    const activeStepIndex = steps.findIndex(step => step.status === 'active');
    if (activeStepIndex >= 0) {
      steps[activeStepIndex] = {
        ...steps[activeStepIndex],
        progress,
        ...(message && { message }),
      };
      jobs.set(id, { ...job, steps });
    }
  }
}

export function deleteJob(id: string): void {
  jobs.delete(id);
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (job && job.status !== "complete" && job.status !== "error" && job.status !== "cancelled") {
    jobs.set(id, {
      ...job,
      status: "cancelled",
      cancelled: true,
      message: "Job cancelled by user",
    });
    console.log(`[jobStore] Cancelled job ${id}`);
    return true;
  }
  return false;
}

export function isJobCancelled(id: string): boolean {
  const job = jobs.get(id);
  return job?.cancelled === true || job?.status === "cancelled";
}

// Clean up old jobs (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    // Use createdAt timestamp if available, otherwise fallback to parsing from ID
    const jobTimestamp = job.createdAt || parseInt(id.split("-")[1] || "0");
    if (jobTimestamp < oneHourAgo) {
      jobs.delete(id);
      console.log(`[jobStore] Cleaned up old job ${id}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

