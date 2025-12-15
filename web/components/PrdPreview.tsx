"use client";

import { markdownToHtml } from "@/lib/markdown";

interface PrdPreviewProps {
  markdown: string;
}

/**
 * Live preview of PRD markdown rendered as styled HTML
 */
export default function PrdPreview({ markdown }: PrdPreviewProps) {
  const html = markdownToHtml(markdown || "");

  if (!markdown || markdown.trim() === "") {
    return (
      <div className="h-full flex items-center justify-center text-center py-12 px-6">
        <div>
          <svg
            className="w-16 h-16 text-[#E7E1E2] mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-[#161010]/50 text-sm">No content yet</p>
          <p className="text-[#161010]/30 text-xs mt-1">Start typing in the editor to see a live preview</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="prose prose-slate max-w-none h-full overflow-y-auto px-6 py-4 text-[#161010] [&_h1]:text-[#161010] [&_h2]:text-[#161010] [&_h3]:text-[#161010] [&_h4]:text-[#161010] [&_p]:text-[#161010] [&_li]:text-[#161010] [&_a]:text-[#F24B57]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

