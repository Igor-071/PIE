"use client";

import React from "react";

interface Step {
  id: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'active' | 'completed';
  progress?: number;
}

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

interface ProgressTrackerProps {
  status: string;
  progress: number;
  message: string;
  error?: string;
  steps?: Step[];
  tokenUsage?: {
    total: TokenUsage;
    byPhase: TokenUsageByPhase[];
  };
  validationResult?: ValidationResult;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  unzipping: "Unzipping Repository",
  tier1: "Extracting Technical Data",
  tier2: "Running AI Analysis",
  tier3: "Generating Detailed Requirements",
  generating: "Generating PRD",
  complete: "Complete",
  error: "Error",
};

interface StepInfo {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const mainSteps: StepInfo[] = [
  {
    key: "unzipping",
    label: "Unzip Repository",
    description: "Extracting and organizing repository files from the ZIP archive",
    icon: "📦",
  },
  {
    key: "tier1",
    label: "Tier 1: Technical Analysis",
    description: "Scanning code to extract screens, API endpoints, data models, and technical architecture",
    icon: "🔍",
  },
  {
    key: "tier2",
    label: "Tier 2: AI Strategy Analysis",
    description: "Using AI to analyze business strategy, target audience, positioning, and value proposition",
    icon: "🤖",
  },
  {
    key: "tier3",
    label: "Tier 3: Detailed Requirements",
    description: "Generating assumptions, dependencies, risk management, acceptance criteria, and technical requirements",
    icon: "⚙️",
  },
  {
    key: "generating",
    label: "Generate PRD",
    description: "Creating structured JSON and Markdown PRD documents with all extracted information",
    icon: "📄",
  },
];

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  return "a while ago";
}

export default function ProgressTracker({
  status,
  progress,
  message,
  error,
  steps = [],
  tokenUsage,
  validationResult,
}: ProgressTrackerProps) {
  const currentStepIndex = mainSteps.findIndex((step) => step.key === status);
  const isComplete = status === "complete";
  const hasError = status === "error";
  const isCancelled = status === "cancelled";

  return (
    <div className="w-full space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-[#E7E1E2] rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-500 ${
            hasError
              ? "bg-[#F24B57]"
              : isCancelled
              ? "bg-[#E7E1E2]"
              : "bg-[#F24B57]"
          }`}
          style={{ width: `${Math.max(progress, 5)}%` }}
        />
      </div>

      {/* Current Status Message */}
      <div className="text-center">
        <p
          className={`text-lg font-semibold ${
            hasError
              ? "text-[#F24B57]"
              : isCancelled
              ? "text-[#161010] opacity-70"
              : "text-[#161010]"
          }`}
        >
          {message || "Processing..."}
        </p>
        {!hasError && !isCancelled && (
          <p className="text-sm text-[#161010] opacity-70 mt-1">{progress}% complete</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-[#F24B57]/10 border-2 border-[#F24B57]/30 rounded-lg text-left">
          <p className="text-sm font-semibold text-[#F24B57] mb-2">Error Details:</p>
          <p className="text-sm text-[#161010] whitespace-pre-wrap break-words">
            {error}
          </p>
          {error.includes("quota") && (
            <div className="mt-3 pt-3 border-t border-[#F24B57]/20">
              <p className="text-xs text-[#F24B57] font-medium mb-1">Quick Fix:</p>
              <ul className="text-xs text-[#161010] list-disc list-inside space-y-1">
                <li>
                  Check your OpenAI billing at{" "}
                  <a
                    href="https://platform.openai.com/account/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#F24B57]"
                  >
                    platform.openai.com/account/billing
                  </a>
                </li>
                <li>Upgrade your plan or wait for quota reset</li>
                <li>Use a different API key with available quota</li>
              </ul>
            </div>
          )}
          {error.includes("authentication") && (
            <div className="mt-3 pt-3 border-t border-[#F24B57]/20">
              <p className="text-xs text-[#F24B57] font-medium mb-1">Quick Fix:</p>
              <ul className="text-xs text-[#161010] list-disc list-inside space-y-1">
                <li>Check your .env file in the project root</li>
                <li>Ensure OPENAI_API_KEY is set correctly</li>
                <li>Restart the web server after updating .env</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainSteps.map((step, index) => {
          const isActive = index <= currentStepIndex || isComplete;
          const isCurrent = step.key === status;
          const isCompleted = index < currentStepIndex || isComplete;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCurrent
                  ? "border-[#F24B57] bg-[#F24B57]/5 shadow-md"
                  : isCompleted
                  ? "border-[#E7E1E2] bg-[#E7E1E2]/30"
                  : "border-[#E7E1E2] bg-white"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                    isCurrent
                      ? "bg-[#F24B57] text-white"
                      : isCompleted
                      ? "bg-[#E7E1E2] text-[#161010]"
                      : "bg-[#E7E1E2] text-[#161010] opacity-50"
                  }`}
                >
                  {isCompleted && !isCurrent ? "✓" : step.icon}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? "text-[#F24B57]"
                        : isCompleted
                        ? "text-[#161010]"
                        : "text-[#161010] opacity-50"
                    }`}
                  >
                    Step {index + 1}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? "text-[#F24B57]"
                        : isCompleted
                        ? "text-[#161010]"
                        : "text-[#161010] opacity-50"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Step Description */}
              <p
                className={`text-xs leading-relaxed ${
                  isCurrent
                    ? "text-[#161010]"
                    : isCompleted
                    ? "text-[#161010] opacity-70"
                    : "text-[#161010] opacity-50"
                }`}
              >
                {step.description}
              </p>

              {/* Current Step Indicator */}
              {isCurrent && !isComplete && !hasError && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#F24B57] rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#F24B57] font-medium">
                    In progress...
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Step Log */}
      {steps.length > 0 && (
        <div className="mt-8 border-t border-[#E7E1E2] pt-6">
          <h3 className="text-lg font-semibold text-[#161010] mb-4">Detailed Progress</h3>
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {steps.map((step, index) => {
              const isActive = step.status === 'active';
              const isCompleted = step.status === 'completed';
              const isPending = step.status === 'pending';

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#F24B57]/5 border-l-4 border-[#F24B57]"
                      : isCompleted
                      ? "bg-[#E7E1E2]/20 border-l-4 border-[#E7E1E2]"
                      : "bg-white/50 border-l-4 border-[#E7E1E2]/50 opacity-60"
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[#E7E1E2] flex items-center justify-center">
                        <span className="text-xs text-[#161010] font-bold">✓</span>
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-[#F24B57] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#E7E1E2] border-2 border-[#E7E1E2]"></div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        isActive
                          ? "text-[#161010] font-medium"
                          : isCompleted
                          ? "text-[#161010]"
                          : "text-[#161010] opacity-60"
                      }`}
                    >
                      {step.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#161010] opacity-50">
                        {formatRelativeTime(step.timestamp)}
                      </span>
                      {isActive && step.progress !== undefined && (
                        <>
                          <span className="text-xs text-[#161010] opacity-50">•</span>
                          <span className="text-xs text-[#F24B57] font-medium">
                            {step.progress}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Token Usage Display */}
      {tokenUsage && tokenUsage.total.totalTokens > 0 && (
        <div className="mt-8 border-t border-[#E7E1E2] pt-6">
          <h3 className="text-lg font-semibold text-[#161010] mb-4">Token Usage</h3>
          <div className="bg-[#E7E1E2]/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#161010]">Total Tokens:</span>
              <span className="text-sm font-bold text-[#161010]">
                {tokenUsage.total.totalTokens.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#161010] opacity-70">Prompt:</span>
                <span className="ml-2 font-medium text-[#161010]">
                  {tokenUsage.total.promptTokens.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#161010] opacity-70">Completion:</span>
                <span className="ml-2 font-medium text-[#161010]">
                  {tokenUsage.total.completionTokens.toLocaleString()}
                </span>
              </div>
            </div>
            {tokenUsage.byPhase && tokenUsage.byPhase.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#E7E1E2]">
                <p className="text-xs font-medium text-[#161010] mb-2">By Phase:</p>
                <div className="space-y-1">
                  {tokenUsage.byPhase.map((phase, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-[#161010] opacity-70">{phase.phase}:</span>
                      <span className="font-medium text-[#161010]">
                        {phase.usage.totalTokens.toLocaleString()} tokens
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Results Display */}
      {validationResult && (
        <div className="mt-6 border-t border-[#E7E1E2] pt-6">
          <h3 className="text-lg font-semibold text-[#161010] mb-4">PRD Validation</h3>
          <div className={`rounded-lg p-4 ${
            validationResult.isValid 
              ? "bg-green-50 border-2 border-green-200" 
              : "bg-yellow-50 border-2 border-yellow-200"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#161010]">Status:</span>
              <span className={`text-sm font-bold ${
                validationResult.isValid ? "text-green-700" : "text-yellow-700"
              }`}>
                {validationResult.isValid ? "✓ Valid" : "⚠ Issues Found"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#161010] opacity-70">Quality Score:</span>
              <span className="text-sm font-bold text-[#161010]">
                {validationResult.score}/100
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs mt-3 pt-3 border-t border-current/20">
              <div>
                <span className="text-[#161010] opacity-70">Errors:</span>
                <span className={`ml-2 font-medium ${
                  validationResult.errors > 0 ? "text-red-600" : "text-[#161010]"
                }`}>
                  {validationResult.errors}
                </span>
              </div>
              <div>
                <span className="text-[#161010] opacity-70">Warnings:</span>
                <span className={`ml-2 font-medium ${
                  validationResult.warnings > 0 ? "text-yellow-600" : "text-[#161010]"
                }`}>
                  {validationResult.warnings}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
