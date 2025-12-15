"use client";

import { useState, useEffect } from "react";
import PrdEditor from "./PrdEditor";
import PolishChatPanel from "./PolishChatPanel";
import DownloadResults from "./DownloadResults";
import ConfirmDialog from "./ConfirmDialog";
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
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "download">("editor");
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    loadPrdData();
  }, [jobId]);

  const loadPrdData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prd?jobId=${encodeURIComponent(jobId)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load PRD");
      }

      const data = await response.json();
      setPrdData(data);
    } catch (err) {
      console.error("[PrdView] Error loading PRD:", err);
      setError(err instanceof Error ? err.message : "Failed to load PRD");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    if (prdData) {
      setPrdData({
        ...prdData,
        markdown: newMarkdown,
      });
    }
  };

  const handleProposalReceived = (proposal: Proposal) => {
    setCurrentProposal(proposal);
    setShowDiff(true);
  };

  const handleApplyProposal = async () => {
    if (!currentProposal || !prdData) return;

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
          markdownPatch: currentProposal.markdownPatch,
          jsonPatch: currentProposal.jsonPatch,
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
      } else {
        // Fallback: reload from server
        await loadPrdData();
      }
      
      // Show feedback about what was applied
      if (!markdownChanged && currentProposal.markdownPatch) {
        setApplyMessage("Applied, but no markdown changes detected. The proposal may have only updated JSON structure.");
      } else if (!markdownChanged && !currentProposal.markdownPatch && currentProposal.jsonPatch) {
        setApplyMessage("Applied JSON changes. No markdown changes were included in this proposal.");
      } else {
        setApplyMessage("Changes applied successfully!");
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setApplyMessage(null), 5000);
      
      // Clear proposal and close diff
      setCurrentProposal(null);
      setShowDiff(false);

    } catch (err) {
      console.error("[PrdView] Error applying proposal:", err);
      alert(err instanceof Error ? err.message : "Failed to apply changes");
    }
  };

  const handleDiscardClick = () => {
    setShowDiscardConfirm(true);
  };

  const handleDiscardConfirm = () => {
    setCurrentProposal(null);
    setShowDiff(false);
    setShowDiscardConfirm(false);
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
    <div className="flex flex-col space-y-6">
      {/* Header with tabs */}
      <div className="border-b border-[#E7E1E2] pb-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor area (2/3 width on large screens) */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            {/* Editor */}
            <div className="border-2 border-[#E7E1E2] rounded-lg bg-white flex flex-col h-[600px]">
              <div className="border-b border-[#E7E1E2] px-4 py-2 flex-shrink-0 flex items-center justify-between">
                <h3 className="font-semibold text-[#161010] text-sm">Editor</h3>
                <button
                  onClick={handleCopyMarkdown}
                  className="px-2 py-1 rounded text-xs font-medium bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80 transition-all"
                >
                  Copy Markdown
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <PrdEditor
                  markdown={prdData.markdown}
                  onChange={handleMarkdownChange}
                  readOnly={false}
                />
              </div>
            </div>

            {/* Apply feedback message */}
            {applyMessage && (
              <div className={`p-3 rounded-lg border-2 ${
                applyMessage.includes("successfully")
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}>
                <p className="text-sm">{applyMessage}</p>
              </div>
            )}
          </div>

          {/* Right sidebar (1/3 width on large screens) */}
          <div className="flex flex-col space-y-4">
            {/* Chat panel */}
            <div className="border-2 border-[#E7E1E2] rounded-lg flex flex-col h-[600px]">
              <PolishChatPanel
                jobId={jobId}
                onProposalReceived={handleProposalReceived}
                disabled={showDiff}
              />
            </div>

            {/* Diff review panel */}
            {showDiff && currentProposal && (
              <div className="border-2 border-[#F24B57] rounded-lg p-4 bg-[#F24B57]/5">
                <h4 className="font-semibold text-[#161010] mb-2">Proposed Changes</h4>
                <p className="text-sm text-[#161010]/80 mb-4">
                  {currentProposal.assistantMessage}
                </p>
                
                {currentProposal.markdownPatch && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[#161010]/60 mb-2">Markdown changes:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-[#E7E1E2] overflow-x-auto max-h-40">
                      {currentProposal.markdownPatch}
                    </pre>
                  </div>
                )}
                
                {currentProposal.followUpQuestions && currentProposal.followUpQuestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-[#161010]/60 mb-2">Questions:</p>
                    <ul className="text-sm space-y-1">
                      {currentProposal.followUpQuestions.map((q, idx) => (
                        <li key={idx} className="text-[#161010]/80">• {q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyProposal}
                    className="flex-1 bg-[#F24B57] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#F24B57]/90 transition-all"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleDiscardClick}
                    className="flex-1 bg-[#E7E1E2] text-[#161010] py-2 px-4 rounded-lg font-medium hover:bg-[#E7E1E2]/80 transition-all"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download view */}
      {viewMode === "download" && (
        <div className="space-y-6">
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

      {/* Confirm Discard Proposal Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard Proposal?"
        message="Are you sure you want to discard these proposed changes? You can always ask the Polish Agent for new suggestions."
        confirmLabel="Yes, Discard"
        cancelLabel="Keep Proposal"
        confirmVariant="danger"
        onConfirm={handleDiscardConfirm}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
}
