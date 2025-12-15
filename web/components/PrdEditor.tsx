"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdown";

interface PrdEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

export interface PrdEditorRef {
  scrollToSection: (sectionName?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

/**
 * Rich-text PRD editor using TipTap
 * Converts markdown to/from HTML for editing
 */
const PrdEditor = forwardRef<PrdEditorRef, PrdEditorProps>(
  ({ markdown, onChange, readOnly = false }, ref) => {
    const lastAppliedMarkdownRef = useRef<string>("");
    const isInitializedRef = useRef(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const isUserEditRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        history: {
          // Enable history for undo/redo
          depth: 50, // Keep last 50 changes in history
        },
      }),
    ],
    editable: !readOnly,
    content: "",
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      if (isInitializedRef.current && !readOnly) {
        // Mark as user edit when onUpdate fires during initialized state
        isUserEditRef.current = true;
        // Convert HTML back to markdown (simplified)
        const html = editor.getHTML();
        const simplifiedMarkdown = htmlToMarkdown(html);
        onChange(simplifiedMarkdown);
      }
    },
  });

  useEffect(() => {
    if (editor) {
      // Only update editor content if markdown changed externally (not from user typing)
      // Skip if this change came from a user edit to preserve history
      if (markdown !== lastAppliedMarkdownRef.current && !isUserEditRef.current) {
        // Convert markdown to HTML for TipTap
        const html = markdownToHtml(markdown);
        
        // Set content without adding to history (false = don't emit update event)
        // This prevents external content updates from being added to undo history
        // User edits will create history entries that can be undone
        editor.commands.setContent(html, false);
        
        lastAppliedMarkdownRef.current = markdown;
        // Reset user edit flag after external update
        isUserEditRef.current = false;
      } else if (isUserEditRef.current) {
        // If this is a user edit, update the ref to match but don't set content
        // (content is already set by the user's typing, we just need to sync the ref)
        lastAppliedMarkdownRef.current = markdown;
      }
      // Mark as initialized once editor is ready
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
    }
  }, [editor, markdown]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToSection: (sectionName?: string) => {
      if (!editor || !editorContainerRef.current) return;

      // Wait a tick for DOM to be ready
      setTimeout(() => {
        const editorElement = editorContainerRef.current?.querySelector('.ProseMirror') as HTMLElement;
        if (!editorElement) return;

        // Find the scrollable parent container (the overflow-y-auto div)
        let scrollContainer: HTMLElement | null = editorContainerRef.current;
        while (scrollContainer && scrollContainer !== document.body) {
          const style = window.getComputedStyle(scrollContainer);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            break;
          }
          scrollContainer = scrollContainer.parentElement;
        }
        
        // If section name provided, try to find it
        if (sectionName) {
          // Search for headings that match the section name (case-insensitive, partial match)
          const headings = editorElement.querySelectorAll('h1, h2, h3, h4');
          const normalizedSearch = sectionName.toLowerCase().trim();
          
          for (const heading of Array.from(headings)) {
            const headingText = heading.textContent?.toLowerCase().trim() || '';
            if (headingText.includes(normalizedSearch) || normalizedSearch.includes(headingText)) {
              // Found matching heading, scroll to it within the container
              const headingElement = heading as HTMLElement;
              const headingRect = headingElement.getBoundingClientRect();
              
              if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const scrollTop = scrollContainer.scrollTop + headingRect.top - containerRect.top - (containerRect.height / 2) + (headingRect.height / 2);
                scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
              } else {
                headingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              
              // Add a highlight flash effect
              const originalBg = headingElement.style.backgroundColor;
              headingElement.style.backgroundColor = '#FEF3C7';
              headingElement.style.transition = 'background-color 0.3s';
              
              setTimeout(() => {
                headingElement.style.backgroundColor = originalBg || '';
                setTimeout(() => {
                  headingElement.style.transition = '';
                }, 300);
              }, 2000);
              
              return;
            }
          }
        }

        // Fallback: scroll to top if no section found
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
    undo: () => {
      if (editor && !readOnly) {
        editor.chain().focus().undo().run();
      }
    },
    redo: () => {
      if (editor && !readOnly) {
        editor.chain().focus().redo().run();
      }
    },
    canUndo: () => {
      return editor ? editor.can().undo() : false;
    },
    canRedo: () => {
      return editor ? editor.can().redo() : false;
    },
    clearHistory: () => {
      if (editor) {
        // Clear history by setting content to current content without adding to history
        const currentContent = editor.getHTML();
        editor.commands.setContent(currentContent, false);
      }
    },
  }), [editor, readOnly]);

  if (!editor) {
    return <div className="text-center py-8 text-[#161010]/50">Loading editor...</div>;
  }

  return (
    <div 
      ref={editorContainerRef}
      className="prose prose-slate max-w-none [&_.ProseMirror]:text-[#161010] [&_.ProseMirror]:outline-none"
    >
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] px-6 py-4 text-[#161010]"
      />
    </div>
  );
});

PrdEditor.displayName = 'PrdEditor';

export default PrdEditor;
