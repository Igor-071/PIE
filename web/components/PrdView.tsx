"use client";

import { useState, useEffect } from "react";
import PrdEditor from "./PrdEditor";
import PolishChatPanel from "./PolishChatPanel";
import DownloadResults from "./DownloadResults";
import ConfirmDialog from "./ConfirmDialog";

interface PrdViewProps {
  jobId: string;
  markdownFilename: string;
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

export default function PrdView({ jobId, markdownFilename }: PrdViewProps) {
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
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="border-b border-[#E7E1E2] pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
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
          
          {/* Validation Score */}
          {prdData.validationResult && (
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
                prdData.validationResult.score >= 80
                  ? "bg-green-100 text-green-800"
                  : prdData.validationResult.score >= 60
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                Score: {prdData.validationResult.score}/100
              </div>
              {prdData.validationResult.errors > 0 && (
                <span className="text-xs text-red-600">
                  {prdData.validationResult.errors} error{prdData.validationResult.errors !== 1 ? "s" : ""}
                </span>
              )}
              {prdData.validationResult.warnings > 0 && (
                <span className="text-xs text-yellow-600">
                  {prdData.validationResult.warnings} warning{prdData.validationResult.warnings !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
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
          <div className="lg:col-span-2 space-y-4">
            {/* Actions bar */}
            <div className="flex justify-end">
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#E7E1E2] text-[#161010] hover:bg-[#E7E1E2]/80 transition-all"
              >
                Copy Markdown
              </button>
            </div>

            {/* Editor */}
            <div className="border-2 border-[#E7E1E2] rounded-lg bg-white">
              <div className="border-b border-[#E7E1E2] px-4 py-2">
                <h3 className="font-semibold text-[#161010] text-sm">Editor</h3>
              </div>
              <div className="min-h-[600px] max-h-[800px] overflow-y-auto">
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
          <div className="space-y-4">
            {/* Validation details */}
            {prdData.validationResult && prdData.validationResult.details && (
              <div className="border-2 border-[#E7E1E2] rounded-lg p-4 bg-white">
                <h4 className="font-semibold text-[#161010] mb-2">Handoff Readiness</h4>
                <p className="text-sm text-[#161010]/80 mb-3">
                  {prdData.validationResult.summary}
                </p>
                
                {prdData.validationResult.details.errors?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-red-600 mb-1">Errors (blocking):</p>
                    <ul className="text-xs space-y-1">
                      {prdData.validationResult.details.errors.slice(0, 3).map((error: any, idx: number) => (
                        <li key={idx} className="text-red-600">• {error.field}: {error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {prdData.validationResult.details.warnings?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-yellow-600 mb-1">Warnings (improve quality):</p>
                    <ul className="text-xs space-y-1">
                      {prdData.validationResult.details.warnings.slice(0, 3).map((warning: any, idx: number) => (
                        <li key={idx} className="text-yellow-600">• {warning.field}: {warning.message}</li>
                      ))}
                      {prdData.validationResult.details.warnings.length > 3 && (
                        <li className="text-yellow-600/60">+ {prdData.validationResult.details.warnings.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Chat panel */}
            <div className="border-2 border-[#E7E1E2] rounded-lg h-[500px] flex flex-col">
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
        <DownloadResults
          jobId={jobId}
          markdownFilename={markdownFilename}
        />
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
