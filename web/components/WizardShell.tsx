"use client";

import { ReactNode } from "react";

export type WizardStep = "inputs" | "processing" | "workspace";

interface WizardShellProps {
  currentStep: WizardStep;
  children: ReactNode;
  onStartOver?: () => void;
  showStartOver?: boolean;
}

const steps: { id: WizardStep; label: string; number: number }[] = [
  { id: "inputs", label: "Inputs", number: 1 },
  { id: "processing", label: "Processing", number: 2 },
  { id: "workspace", label: "PRD Workspace", number: 3 },
];

export default function WizardShell({
  currentStep,
  children,
  onStartOver,
  showStartOver = false,
}: WizardShellProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isWorkspace = currentStep === "workspace";

  return (
    <div className={isWorkspace ? "h-screen overflow-hidden flex flex-col bg-[#F9F9F9]" : "min-h-screen flex flex-col bg-[#F9F9F9]"}>
      {/* Header */}
      <header className="bg-white border-b border-[#E7E1E2] sticky top-0 z-50 shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#161010]">
                Product Intelligence Engine
              </h1>
              <p className="text-sm text-[#161010]/60 mt-0.5">
                Convert repositories and prototypes into structured PRDs
              </p>
            </div>
            {showStartOver && onStartOver && (
              <button
                onClick={onStartOver}
                className="px-4 py-2 bg-[#E7E1E2] text-[#161010] rounded-lg font-medium hover:bg-[#E7E1E2]/80 transition-all text-sm"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-[#E7E1E2] shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="flex items-center"
                >
                  {/* Step Circle */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        isActive
                          ? "bg-[#F24B57] text-white shadow-md"
                          : isCompleted
                          ? "bg-[#DDC1B2] text-[#161010]"
                          : "bg-[#E7E1E2] text-[#161010]/50"
                      }`}
                    >
                      {isCompleted ? "✓" : step.number}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-[#F24B57]"
                            : isAccessible
                            ? "text-[#161010]"
                            : "text-[#161010]/50"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 sm:w-20 h-0.5 mx-2 transition-all ${
                        index < currentStepIndex
                          ? "bg-[#DDC1B2]"
                          : "bg-[#E7E1E2]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile step label */}
          <div className="sm:hidden mt-3 text-center">
            <p className="text-sm font-medium text-[#161010]">
              {steps[currentStepIndex]?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-4 lg:px-8 ${isWorkspace ? 'py-8 flex flex-col min-h-0 overflow-hidden' : 'py-8 flex flex-col min-h-0'}`}>
        {children}
      </main>
    </div>
  );
}

