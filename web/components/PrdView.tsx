"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PrdEditor, { PrdEditorRef } from "./PrdEditor";
import PolishChatPanel from "./PolishChatPanel";
import DownloadResults from "./DownloadResults";
import ProgressTracker from "./ProgressTracker";

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface TokenUsageByPhase {
  phase: string;
  usage: TokenUsage;
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: number;
  warnings: number;
}

interface PrdViewProps {
  jobId: string;
  markdownFilename: string;
  tokenUsage?: {
    total: TokenUsage;
    byPhase: TokenUsageByPhase[];
  };
  validationResult?: ValidationResult;
  steps?: Array<{
    id: string;
    message: string;
    timestamp: number;
    status: 'pending' | 'active' | 'completed';
    progress?: number;
  }>;
}

interface PrdData {
  prdJson: any;
  markdown: string;
  markdownFilename: string;
  questions: any;
  version: number;
  hasVersionHistory: boolean;
  validationResult?: {
    isValid: boolean;
    score: number;
    errors: number;
    warnings: number;
    summary: string;
    details: any;
  };
}

interface Proposal {
  assistantMessage: string;
  markdownPatch: string;
  jsonPatch: any;
  followUpQuestions?: string[];
}

export default function PrdView({ 
  jobId, 
  markdownFilename,
  tokenUsage,
  validationResult: propValidationResult,
  steps,
}: PrdViewProps) {
  const [prdData, setPrdData] = useState<PrdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "download">("editor");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const editorRef = useRef<PrdEditorRef>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const hasUserEditedRef = useRef(false);
  const prdDataVersionRef = useRef<number>(0);

  useEffect(() => {
    loadPrdData();
  }, [jobId]);

  // Update undo/redo button states periodically when editor is active
  useEffect(() => {
    if (!editorRef.current || viewMode !== "editor") {
      setCanUndo(false);
      setCanRedo(false);
      hasUserEditedRef.current = false;
      return;
    }

    // Only reset undo/redo state when a completely new PRD is loaded (version changed from 0 or jobId changed)
    // Don't reset when prdData changes due to user edits or proposal applications
    const isNewPrdLoad = prdData && prdData.version !== prdDataVersionRef.current && prdDataVersionRef.current === 0;
    if (isNewPrdLoad) {
      setCanUndo(false);
      setCanRedo(false);
      hasUserEditedRef.current = false;
      if (prdData) {
        prdDataVersionRef.current = prdData.version;
      }
    }

    const updateUndoRedoState = () => {
      if (editorRef.current) {
        // Only allow undo if user has actually made edits
        // This prevents undo from being enabled on initial load
        if (hasUserEditedRef.current) {
          const canUndoValue = editorRef.current.canUndo();
          const canRedoValue = editorRef.current.canRedo();
          setCanUndo(canUndoValue);
          setCanRedo(canRedoValue);
        } else {
          // Force disabled until user makes edits
          setCanUndo(false);
          setCanRedo(false);
        }
      }
    };

    // Delay initial check to allow editor to finish setting content
    // This ensures that initial content load doesn't create undo history
    const timeoutId = setTimeout(() => {
      updateUndoRedoState();
    }, 200);

    // Update on editor changes (check every 300ms to reduce overhead)
    const interval = setInterval(updateUndoRedoState, 300);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [prdData, viewMode]);

  const handleUndo = useCallback(() => {
    if (editorRef.current && canUndo) {
      editorRef.current.undo();
      // After undo, redo should become enabled
      setTimeout(() => {
        if (editorRef.current && hasUserEditedRef.current) {
          setCanUndo(editorRef.current.canUndo());
          setCanRedo(editorRef.current.canRedo());
        }
      }, 50);
    }
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (editorRef.current && canRedo) {
      editorRef.current.redo();
      // After redo, update both states
      setTimeout(() => {
        if (editorRef.current && hasUserEditedRef.current) {
          setCanUndo(editorRef.current.canUndo());
          setCanRedo(editorRef.current.canRedo());
        }
      }, 50);
    }
  }, [canRedo]);

  const loadPrdData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prd?jobId=${encodeURIComponent(jobId)}`);
      
      if (!response.ok) {
        let errorMessage = "Failed to load PRD";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Set error state without throwing to avoid React error boundary
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setPrdData(data);
      // Reset undo/redo state and version tracking when PRD is first loaded
      setCanUndo(false);
      setCanRedo(false);
      hasUserEditedRef.current = false;
      prdDataVersionRef.current = 0; // Reset version tracker so next load is considered "new"
      setIsLoading(false);
    } catch (err) {
      // Only log to console, don't throw to avoid error overlay
      console.error("[PrdView] Error loading PRD:", err);
      setError(err instanceof Error ? err.message : "Failed to load PRD");
      setIsLoading(false);
    }
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    // Mark that user has made edits - this enables undo functionality
    hasUserEditedRef.current = true;
    
    // Update undo/redo state when user makes edits
    // Use multiple timeouts to catch TipTap's history updates at different stages
    // TipTap updates history asynchronously, so we need to check multiple times
    const updateState = () => {
      if (editorRef.current && hasUserEditedRef.current) {
        const canUndoValue = editorRef.current.canUndo();
        const canRedoValue = editorRef.current.canRedo();
        setCanUndo(canUndoValue);
        setCanRedo(canRedoValue);
      }
    };
    
    // Check immediately and then again after delays to catch async history updates
    updateState();
    setTimeout(updateState, 50);
    setTimeout(updateState, 150);
    setTimeout(updateState, 300);
    
    if (prdData) {
      setPrdData({
        ...prdData,
        markdown: newMarkdown,
      });
    }
  };

  const handleApplyProposal = async (proposal: Proposal): Promise<{ ok: boolean; message?: string }> => {
    if (!prdData) {
      return { ok: false, message: "PRD data not loaded" };
    }

    const previousMarkdown = prdData.markdown;
    setApplyMessage(null);

    try {
      const response = await fetch("/api/prd/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          markdownPatch: proposal.markdownPatch,
          jsonPatch: proposal.jsonPatch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply changes");
      }

      const result = await response.json();
      
      // Check if markdown actually changed
      const markdownChanged = result.updatedMarkdown !== previousMarkdown;
      
      // Update PRD data with the result (including new validation)
      if (result.validationResult) {
        setPrdData({
          ...prdData,
          prdJson: result.updatedJson,
          markdown: result.updatedMarkdown,
          version: result.version,
          validationResult: result.validationResult,
        });
        // After applying changes, mark that edits have been made
        // This enables undo functionality
        hasUserEditedRef.current = true;
        
        // Wait for editor to process the new content, then force undo to be enabled
        setTimeout(() => {
          // After applying changes, undo should be enabled (to undo the applied change)
          // Even if TipTap doesn't have history yet, we enable it because the user should
          // be able to undo back to the previous state
          setCanUndo(true);
          setCanRedo(false); // Redo should be disabled after applying new changes
        }, 200);
      } else {
        // Fallback: reload from server
        await loadPrdData();
      }
      
      // Show feedback about what was applied
      if (!markdownChanged && proposal.markdownPatch) {
        setApplyMessage("Applied, but no markdown changes detected. The proposal may have only updated JSON structure.");
      } else if (!markdownChanged && !proposal.markdownPatch && proposal.jsonPatch) {
        setApplyMessage("Applied JSON changes. No markdown changes were included in this proposal.");
      } else {
        setApplyMessage("Changes applied successfully!");
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setApplyMessage(null), 5000);
      
      return { ok: true };

    } catch (err) {
      console.error("[PrdView] Error applying proposal:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to apply changes";
      return { ok: false, message: errorMessage };
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F24B57] mx-auto mb-4"></div>
        <p className="text-[#161010]">Loading PRD...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#F24B57] mb-4">Error: {error}</p>
        <button
          onClick={loadPrdData}
          className="px-6 py-2 bg-[#F24B57] text-white rounded-lg hover:bg-[#F24B57]/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!prdData) {
    return <div className="text-center py-12 text-[#161010]/50">No PRD data available</div>;
  }

  const handleCopyMarkdown = () => {
    if (prdData?.markdown) {
      navigator.clipboard.writeText(prdData.markdown);
      // Could add a toast notification here
      alert("Markdown copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-6">
      {/* Header with tabs */}
      <div className="border-b border-[#E7E1E2] pb-4 flex-shrink-0">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#161010]">PRD Editor</h2>
          {viewMode === "editor" && (
            <p className="text-xs text-[#161010]/60 mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-[#F24B57] rounded-full animate-pulse"></span>
                Live editing • Changes are local (not saved to files)
              </span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setViewMode("editor")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "editor"
                ? "bg-[#F24B57] text-white"
                : "bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80"
            }`}
          >
            Editor & Polish
          </button>
          <button
            onClick={() => setViewMode("download")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "download"
                ? "bg-[#F24B57] text-white"
                : "bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80"
            }`}
          >
            Download Files
          </button>
        </div>
        {prdData.hasVersionHistory && (
          <p className="text-xs text-[#161010]/60 mt-2">
            Version {prdData.version} • {prdData.hasVersionHistory ? "Has edit history" : "Original"}
          </p>
        )}
      </div>

      {/* Editor view */}
      {viewMode === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Main editor area (2/3 width on large screens) */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            {/* Editor */}
            <div className="border-2 border-[#E7E1E2] rounded-lg bg-white flex flex-col h-full min-h-0">
              <div className="border-b border-[#E7E1E2] px-4 py-2 flex-shrink-0 flex items-center justify-between">
                <h3 className="font-semibold text-[#161010] text-sm">Editor</h3>
                <div className="flex items-center gap-1">
                  {/* Undo/Redo buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      title="Undo (⌘Z / Ctrl+Z)"
                      className={`p-1.5 rounded transition-all ${
                        canUndo
                          ? "bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80 cursor-pointer"
                          : "bg-[#E7E1E2]/40 text-[#161010]/40 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      title="Redo (⌘⇧Z / Ctrl+Shift+Z)"
                      className={`p-1.5 rounded transition-all ${
                        canRedo
                          ? "bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80 cursor-pointer"
                          : "bg-[#E7E1E2]/40 text-[#161010]/40 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 15l6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="h-6 w-px bg-[#E7E1E2] mx-1"></div>
                  <button
                    onClick={handleCopyMarkdown}
                    title="Copy Markdown"
                    className="p-1.5 rounded bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80 transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 7.5V15a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 20.25 15v-7.5A2.25 2.25 0 0 0 18 5.25h-7.5A2.25 2.25 0 0 0 8.25 7.5Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 5.25v-1.5A2.25 2.25 0 0 0 13.5 1.5h-7.5a2.25 2.25 0 0 0-2.25 2.25v7.5a2.25 2.25 0 0 0 2.25 2.25h1.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <PrdEditor
                  ref={editorRef}
                  markdown={prdData.markdown}
                  onChange={handleMarkdownChange}
                  readOnly={false}
                />
              </div>
            </div>

            {/* Apply feedback message */}
            {applyMessage && (
              <div className={`p-3 rounded-lg border-2 flex-shrink-0 ${
                applyMessage.includes("successfully")
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}>
                <p className="text-sm">{applyMessage}</p>
              </div>
            )}
          </div>

          {/* Right sidebar (1/3 width on large screens) */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Chat panel */}
            <div className="border-2 border-[#E7E1E2] rounded-lg flex flex-col h-full min-h-0">
              <PolishChatPanel
                jobId={jobId}
                onApplyProposal={handleApplyProposal}
                disabled={false}
                onScrollToChange={(section) => {
                  editorRef.current?.scrollToSection(section);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Download view */}
      {viewMode === "download" && (
        <div className="space-y-6 overflow-y-auto flex-1 min-h-0">
          <DownloadResults
            jobId={jobId}
            markdownFilename={markdownFilename}
          />
          
          {/* Show token usage and validation results */}
          {(tokenUsage || propValidationResult || steps) && (
            <div className="bg-white rounded-lg shadow-lg p-8 border border-[#E7E1E2]">
              <ProgressTracker
                status="complete"
                progress={100}
                message="PRD generation complete"
                steps={steps}
                tokenUsage={tokenUsage}
                validationResult={propValidationResult}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
