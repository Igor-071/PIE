"use client";

import { ReactNode } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    confirmVariant === "danger"
      ? "bg-[#F24B57] text-white hover:bg-[#F24B57]/90"
      : "bg-[#161010] text-white hover:bg-[#161010]/90";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4 border-2 border-[#E7E1E2]">
        {/* Title */}
        <h3 className="text-xl font-bold text-[#161010]">{title}</h3>

        {/* Message */}
        <div className="text-[#161010]/80 text-sm leading-relaxed">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-[#E7E1E2] text-[#161010] rounded-lg font-medium hover:bg-[#E7E1E2]/80 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${confirmButtonClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

