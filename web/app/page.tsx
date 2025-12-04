"use client";

import { useState, useEffect, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import BriefFileUpload from "@/components/BriefFileUpload";
import ProgressTracker from "@/components/ProgressTracker";
import DownloadResults from "@/components/DownloadResults";

type JobStatus =
  | "pending"
  | "unzipping"
  | "tier1"
  | "tier2"
  | "tier3"
  | "generating"
  | "complete"
  | "error"
  | "cancelled";

interface JobState {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  error?: string;
  outputDir?: string;
  projectName?: string;
  markdownFilename?: string;
  networkError?: boolean; // Track if error is network-related
}

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const POLL_INTERVAL = 2000; // 2 seconds

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [briefText, setBriefText] = useState("");
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [jobState, setJobState] = useState<JobState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to fetch with timeout
  const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  useEffect(() => {
    // Reset retry count when job state changes
    retryCountRef.current = 0;

    if (jobState && jobState.status !== "complete" && jobState.status !== "error" && jobState.status !== "cancelled") {
      // Capture jobId to avoid stale closure issues
      const currentJobId = jobState.id;
      
      const pollProgress = async () => {
        // Abort any pending requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        try {
          const url = `/api/progress?jobId=${encodeURIComponent(currentJobId)}`;
          console.log("Fetching progress from:", url);
          
          const response = await fetchWithTimeout(url);
          
          // Reset retry count on successful request
          retryCountRef.current = 0;
          
          if (response.ok) {
            const updatedState = await response.json();
            console.log("Progress update:", updatedState);
            
            // Clear any previous network errors
            setJobState((prevState) => ({
              ...updatedState,
              networkError: false,
            }));

            if (updatedState.status === "complete" || updatedState.status === "error" || updatedState.status === "cancelled") {
              setIsProcessing(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          } else {
            // Handle HTTP errors
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            console.error("Failed to fetch progress:", response.status, errorData);
            
            if (response.status === 404) {
              // Job not found - mark as error
              setJobState((prevState) => {
                if (!prevState || prevState.id !== currentJobId) return prevState;
                return {
                  ...prevState,
                  status: "error",
                  error: `Job not found: ${errorData.error || "Unknown error"}`,
                  networkError: false,
                };
              });
              setIsProcessing(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            } else if (response.status >= 500) {
              // Server errors - retry with exponential backoff
              retryCountRef.current += 1;
              if (retryCountRef.current >= MAX_RETRIES) {
                setJobState((prevState) => {
                  if (!prevState || prevState.id !== currentJobId) return prevState;
                  return {
                    ...prevState,
                    status: "error",
                    error: `Server error: ${errorData.error || "Unable to connect to server. Please try again later."}`,
                    networkError: false,
                  };
                });
                setIsProcessing(false);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              } else {
                // Show temporary error but keep polling
                setJobState((prevState) => {
                  if (!prevState || prevState.id !== currentJobId) return prevState;
                  return {
                    ...prevState,
                    message: `Connection issue (retry ${retryCountRef.current}/${MAX_RETRIES})...`,
                  };
                });
              }
            }
          }
        } catch (error) {
          // Handle network errors (Failed to fetch, timeout, etc.)
          const isAborted = error instanceof Error && error.name === "AbortError";
          const isNetworkError = error instanceof TypeError || error instanceof DOMException;
          
          if (isAborted) {
            console.warn("Fetch request aborted (timeout or cancelled)");
            return; // Don't increment retry for aborted requests
          }

          if (isNetworkError) {
            retryCountRef.current += 1;
            console.error(`Network error fetching progress (attempt ${retryCountRef.current}/${MAX_RETRIES}):`, error);
            
            if (retryCountRef.current >= MAX_RETRIES) {
              // Max retries reached - show error
              setJobState((prevState) => {
                if (!prevState || prevState.id !== currentJobId) return prevState;
                return {
                  ...prevState,
                  status: "error",
                  error: "Network connection failed. Please check your internet connection and try again.",
                  networkError: true,
                };
              });
              setIsProcessing(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            } else {
              // Show temporary error but keep polling
              setJobState((prevState) => {
                if (!prevState || prevState.id !== currentJobId) return prevState;
                return {
                  ...prevState,
                  message: `Connection issue (retry ${retryCountRef.current}/${MAX_RETRIES})...`,
                  networkError: true,
                };
              });
            }
          } else {
            // Unexpected error
            console.error("Unexpected error fetching progress:", error);
            retryCountRef.current += 1;
            if (retryCountRef.current >= MAX_RETRIES) {
              setJobState((prevState) => {
                if (!prevState || prevState.id !== currentJobId) return prevState;
                return {
                  ...prevState,
                  status: "error",
                  error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
                  networkError: false,
                };
              });
              setIsProcessing(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        }
      };

      // Initial poll
      pollProgress();

      // Set up polling interval
      intervalRef.current = setInterval(pollProgress, POLL_INTERVAL);

      // Cleanup function
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        retryCountRef.current = 0;
      };
    } else {
      // Clean up if job is complete, error, or cancelled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      retryCountRef.current = 0;
    }
  }, [jobState?.id, jobState?.status]); // Depend on both ID and status to properly clean up interval

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please upload a ZIP file (required)");
      return;
    }

    setIsProcessing(true);
    console.log("Starting PRD generation...");

    try {
      const formData = new FormData();
      formData.append("zipFile", selectedFile);
      if (briefText.trim()) {
        formData.append("briefText", briefText);
      }
      // Append all brief files
      briefFiles.forEach((file) => {
        formData.append("briefFiles", file);
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start processing");
      }

      const result = await response.json();
      console.log("Job created:", result);
      setJobState({
        id: result.jobId,
        status: "pending",
        progress: 0,
        message: "Job created, starting processing...",
      });
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Failed to start processing");
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setBriefText("");
    setBriefFiles([]);
    setJobState(null);
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    if (!jobState) return;

    try {
      const response = await fetch("/api/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: jobState.id }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Job cancelled:", result);
        setJobState({
          ...jobState,
          status: "cancelled",
          message: "Job cancelled by user",
        });
        setIsProcessing(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel job");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert("Failed to cancel job. Please try again.");
    }
  };

  const handleRetry = () => {
    if (!jobState) return;
    
    // Reset retry count and network error state
    retryCountRef.current = 0;
    setJobState({
      ...jobState,
      status: jobState.status === "error" ? "pending" : jobState.status,
      error: undefined,
      networkError: false,
      message: "Retrying connection...",
    });
    setIsProcessing(true);
  };

  return (
    <div className="min-h-screen bg-[#161010]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8 border border-[#E7E1E2]">
          {/* Header */}
          <div className="text-center border-b border-[#E7E1E2] pb-6">
            <h1 className="text-4xl font-bold text-[#161010] mb-2">
              Product Intelligence Engine
            </h1>
            <p className="text-[#161010] text-lg">
              Convert your ZIP repository into a structured Product Requirements Document
            </p>
          </div>

          {/* File Upload */}
          {!jobState && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#161010] mb-3">
                  Upload Repository ZIP File{" "}
                  <span className="text-[#F24B57]">*</span>
                </label>
                <p className="text-xs text-[#161010] mb-3 opacity-80">
                  Required: Upload your repository as a ZIP file
                </p>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </div>

              {/* Brief Section */}
              <div className="space-y-4 border-t border-[#E7E1E2] pt-6">
                <div>
                  <label className="block text-sm font-semibold text-[#161010] mb-2">
                    Optional Brief{" "}
                    <span className="text-[#161010] font-normal text-xs opacity-70">(Additional context about your product)</span>
                  </label>
                  <p className="text-xs text-[#161010] mb-3 opacity-80">
                    Optional: Provide additional context via text or upload documents (PDF, DOC, DOCX, TXT, MD)
                  </p>
                  
                  {/* Brief Text Area */}
                  <textarea
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    placeholder="Enter any additional context, requirements, or information about your product..."
                    className="w-full px-4 py-3 border-2 border-[#E7E1E2] rounded-lg focus:ring-2 focus:ring-[#F24B57] focus:border-[#F24B57] resize-none transition-all mb-4 text-[#161010] placeholder:text-[#161010]/50"
                    rows={4}
                  />

                  {/* Brief File Upload */}
                  <BriefFileUpload
                    onFilesSelect={setBriefFiles}
                    selectedFiles={briefFiles}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-[#F24B57] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#F24B57]/90 disabled:bg-[#E7E1E2] disabled:text-[#161010]/50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isProcessing ? "Processing..." : "Generate PRD"}
              </button>
            </div>
          )}

          {/* Progress Tracker - Show immediately when jobState exists */}
          {jobState && jobState.status !== "complete" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E7E1E2] pb-4">
                <h2 className="text-xl font-semibold text-[#161010]">Processing...</h2>
                {jobState.status !== "error" && jobState.status !== "cancelled" && (
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2 bg-[#F24B57] text-white rounded-lg font-medium hover:bg-[#F24B57]/90 transition-all duration-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <ProgressTracker
                status={jobState.status}
                progress={jobState.progress}
                message={jobState.message}
                error={jobState.error}
              />
              {(jobState.status === "error" || jobState.status === "cancelled") && (
                <div className="flex gap-3">
                  {jobState.networkError && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 bg-[#F24B57] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#F24B57]/90 transition-all duration-200"
                    >
                      Retry Connection
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className={`${jobState.networkError ? "flex-1" : "w-full"} bg-[#E7E1E2] text-[#161010] py-3 px-4 rounded-lg font-semibold hover:bg-[#E7E1E2]/80 transition-all duration-200`}
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Download Results */}
          {jobState && jobState.status === "complete" && jobState.markdownFilename && (
            <div className="space-y-6">
              <div className="text-center border-b border-[#E7E1E2] pb-4">
                <h2 className="text-2xl font-bold text-[#161010] mb-2">Success!</h2>
                <p className="text-[#161010] opacity-80">Your PRD has been generated successfully</p>
              </div>
              <DownloadResults
                jobId={jobState.id}
                markdownFilename={jobState.markdownFilename}
              />
              <button
                onClick={handleReset}
                className="w-full bg-[#F24B57] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#F24B57]/90 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Generate Another PRD
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
