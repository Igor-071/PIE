"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown";

interface PrdEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

/**
 * Rich-text PRD editor using TipTap
 * Converts markdown to/from HTML for editing
 */
export default function PrdEditor({ markdown, onChange, readOnly = false }: PrdEditorProps) {
  const lastAppliedMarkdownRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
    ],
    editable: !readOnly,
    content: "",
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      if (isInitializedRef.current && !readOnly) {
        // Convert HTML back to markdown (simplified)
        const html = editor.getHTML();
        const simplifiedMarkdown = htmlToMarkdown(html);
        onChange(simplifiedMarkdown);
      }
    },
  });

  useEffect(() => {
    if (editor) {
      // Only update editor content if markdown changed externally (not from typing)
      if (markdown !== lastAppliedMarkdownRef.current) {
        // Convert markdown to HTML for TipTap
        const html = markdownToHtml(markdown);
        editor.commands.setContent(html);
        lastAppliedMarkdownRef.current = markdown;
      }
      // Mark as initialized once editor is ready
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
    }
  }, [editor, markdown]);

  if (!editor) {
    return <div className="text-center py-8 text-[#161010]/50">Loading editor...</div>;
  }

  return (
    <div className="prose prose-slate max-w-none [&_.ProseMirror]:text-[#161010] [&_.ProseMirror]:outline-none">
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] px-6 py-4 text-[#161010]"
      />
    </div>
  );
}
