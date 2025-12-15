"use client";

import { ReactNode } from "react";

interface WizardStepProps {
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export default function WizardStep({
  title,
  description,
  children,
  maxWidth = "lg",
}: WizardStepProps) {
  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} space-y-6`}>
      {(title || description) && (
        <div className="text-center space-y-2">
          {title && (
            <h2 className="text-3xl font-bold text-[#161010]">{title}</h2>
          )}
          {description && (
            <p className="text-[#161010]/70 text-lg">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

