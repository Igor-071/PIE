"use client";

import { useState, useRef, useEffect } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { extractBeforeAfter, getChangeLocation } from "@/lib/diffParser";

interface Proposal {
  assistantMessage: string;
  markdownPatch: string;
  jsonPatch: any;
  followUpQuestions?: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  proposal?: Proposal;
}

interface PolishChatPanelProps {
  jobId: string;
  onApplyProposal?: (proposal: Proposal) => Promise<{ ok: boolean; message?: string }>;
  disabled?: boolean;
  onScrollToChange?: (section?: string) => void;
}

export default function PolishChatPanel({ 
  jobId, 
  onApplyProposal,
  disabled = false,
  onScrollToChange,
}: PolishChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickPromptsExpanded, setIsQuickPromptsExpanded] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);
  const [applyingProposalId, setApplyingProposalId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  // Track scroll position to determine if user is near bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100; // Within 100px of bottom
    userScrolledUpRef.current = !isNearBottomRef.current && messages.length > 0;
  };

  const scrollToBottom = (force = false) => {
    if (force || isNearBottomRef.current || messages.length === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      isNearBottomRef.current = true;
      userScrolledUpRef.current = false;
    }
  };

  // Auto-collapse quick prompts after first message
  useEffect(() => {
    if (messages.length > 0 && isQuickPromptsExpanded) {
      setIsQuickPromptsExpanded(false);
    }
  }, [messages.length]);

  // Auto-scroll only when appropriate
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    // Always scroll for user messages, conditionally for assistant messages
    if (lastMessage.role === "user" || isNearBottomRef.current) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages]);

  // Reset scroll tracking when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      isNearBottomRef.current = true;
      userScrolledUpRef.current = false;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/prd/polish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: result.assistantMessage,
        timestamp: Date.now(),
        proposal: (result.markdownPatch || result.jsonPatch) ? {
          assistantMessage: result.assistantMessage,
          markdownPatch: result.markdownPatch || "",
          jsonPatch: result.jsonPatch || null,
          followUpQuestions: result.followUpQuestions,
        } : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("[PolishChat] Error:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
    setShowClearConfirm(false);
    setIsQuickPromptsExpanded(true);
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleCopyTranscript = () => {
    const transcript = messages
      .map((msg) => `${msg.role === "user" ? "You" : "PIE"}: ${msg.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(transcript);
    // Could add toast notification here
  };

  const handleApplyProposal = async (messageId: string, proposal: Proposal) => {
    if (!onApplyProposal || applyingProposalId) return;
    
    setApplyingProposalId(messageId);
    try {
      const result = await onApplyProposal(proposal);
      if (result.ok) {
        // Extract section info for scrolling
        if (proposal.markdownPatch && onScrollToChange) {
          const { section } = extractBeforeAfter(proposal.markdownPatch);
          // Delay to ensure editor content has updated after apply
          setTimeout(() => {
            onScrollToChange(section);
          }, 300);
        }
        
        // Remove proposal from message after successful apply
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, proposal: undefined } : msg
        ));
      }
    } catch (error) {
      console.error("[PolishChat] Error applying proposal:", error);
      alert(error instanceof Error ? error.message : "Failed to apply changes");
    } finally {
      setApplyingProposalId(null);
    }
  };

  const handleDiscardProposal = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, proposal: undefined } : msg
    ));
  };

  const quickPrompts = [
    "Make acceptance criteria more testable",
    "Add more technical details",
    "Improve clarity of requirements",
    "Expand on user stories",
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-[#E7E1E2] px-4 py-3 bg-gradient-to-r from-[#F24B57]/5 to-transparent flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: 'var(--mop-red)', border: 'none' }}>
              PIE
            </div>
            <div>
              <h3 className="font-semibold text-[#161010] text-sm">PIE Assistant</h3>
              <p className="text-xs text-[#161010]/60">
                AI-powered PRD refinement
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTranscript}
                className="p-1.5 rounded hover:bg-[#E7E1E2]/50 transition-colors"
                title="Copy transcript"
              >
                <svg className="w-4 h-4 text-[#161010]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded hover:bg-[#E7E1E2]/50 transition-colors"
                title="Clear chat"
              >
                <svg className="w-4 h-4 text-[#161010]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F9F9F9] min-h-0 ${messages.length === 0 ? 'flex flex-col' : ''}`}
      >
        {/* Disabled state banner */}
        {disabled && messages.length > 0 && (
          <div className="bg-[#F24B57]/10 border border-[#F24B57]/20 rounded-lg px-3 py-2 flex items-start gap-2">
            <svg className="w-4 h-4 text-[#F24B57] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-[#161010]/80">
              Chat is disabled while reviewing a proposal. Apply or discard the proposal to continue chatting.
            </p>
          </div>
        )}

        {/* Empty state - less visually heavy */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md mb-3" style={{ backgroundColor: 'var(--mop-red)' }}>
              PIE
            </div>
            <h4 className="text-sm font-semibold text-[#161010] mb-1">Start a conversation</h4>
            <p className="text-xs text-[#161010]/60 text-center max-w-xs">
              Ask me to improve clarity, add details, or refine any section of your PRD
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F24B57] to-[#DDC1B2] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-1">
                PIE
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2.5 shadow-sm ${
                message.role === "user"
                  ? "bg-[#F24B57] text-white rounded-br-none"
                  : "bg-white text-[#161010] border border-[#E7E1E2] rounded-bl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.proposal && (
                <div className="mt-3 pt-3 border-t border-[#E7E1E2]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">✨</span>
                      <span className="text-xs font-semibold text-[#161010]">Proposed Changes</span>
                    </div>
                    
                    {message.proposal.followUpQuestions && message.proposal.followUpQuestions.length > 0 && (
                      <div className="bg-[#F9F9F9] rounded p-2">
                        <p className="text-xs font-medium text-[#161010]/70 mb-1.5">Questions:</p>
                        <ul className="text-xs space-y-1 text-[#161010]/80">
                          {message.proposal.followUpQuestions.map((q, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span>•</span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {message.proposal.markdownPatch && (() => {
                      const { before, after, section } = extractBeforeAfter(message.proposal.markdownPatch);
                      const isExpanded = expandedDiffId === message.id;
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => setExpandedDiffId(isExpanded ? null : message.id)}
                              className="text-xs font-medium text-[#F24B57] hover:text-[#F24B57]/80 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Hide changes
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show changes
                                </>
                              )}
                            </button>
                            {section && onScrollToChange && (
                              <button
                                onClick={() => onScrollToChange(section)}
                                className="text-xs font-medium text-[#161010]/60 hover:text-[#F24B57] flex items-center gap-1"
                                title={`Scroll to: ${section}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Go to section
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mt-2 space-y-3">
                              {before.trim() && (
                                <div>
                                  <div className="text-xs font-semibold text-[#161010]/70 mb-1.5 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    Before
                                  </div>
                                  <div className="text-xs bg-red-50 border border-red-200 rounded p-2.5 max-h-32 overflow-y-auto text-[#161010]/90 whitespace-pre-wrap font-mono">
                                    {before.trim()}
                                  </div>
                                </div>
                              )}
                              {after.trim() && (
                                <div>
                                  <div className="text-xs font-semibold text-[#161010]/70 mb-1.5 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    {before.trim() ? "After" : "New Content"}
                                  </div>
                                  <div className="text-xs bg-green-50 border border-green-200 rounded p-2.5 max-h-32 overflow-y-auto text-[#161010]/90 whitespace-pre-wrap font-mono">
                                    {after.trim()}
                                  </div>
                                </div>
                              )}
                              {!before.trim() && !after.trim() && (
                                <div className="text-xs text-[#161010]/50 italic p-2 bg-[#F9F9F9] rounded border border-[#E7E1E2]">
                                  No visible changes detected in markdown
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApplyProposal(message.id, message.proposal!)}
                        disabled={!onApplyProposal || applyingProposalId === message.id || disabled}
                        className="flex-1 bg-[#F24B57] text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-[#F24B57]/90 disabled:bg-[#E7E1E2] disabled:text-[#161010]/30 disabled:cursor-not-allowed transition-all"
                      >
                        {applyingProposalId === message.id ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Applying...
                          </span>
                        ) : (
                          "Apply Changes"
                        )}
                      </button>
                      <button
                        onClick={() => handleDiscardProposal(message.id)}
                        disabled={applyingProposalId === message.id || disabled}
                        className="flex-1 bg-[#E7E1E2] text-[#161010] py-1.5 px-3 rounded text-xs font-medium hover:bg-[#E7E1E2]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-[#E7E1E2] flex items-center justify-center text-[#161010] font-medium text-xs flex-shrink-0 mt-1">
                You
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F24B57] to-[#DDC1B2] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-1">
              PIE
            </div>
            <div className="bg-white border border-[#E7E1E2] rounded-lg rounded-bl-none px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#F24B57] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#F24B57] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#F24B57] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-xs text-[#161010]/60">Thinking...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E7E1E2] bg-white px-4 py-3 flex-shrink-0">
        {/* Quick Prompts Section - Above input */}
        <div className="mb-3 space-y-2">
          <button
            onClick={() => setIsQuickPromptsExpanded(!isQuickPromptsExpanded)}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-[#161010]/70 hover:text-[#161010] transition-colors"
            aria-expanded={isQuickPromptsExpanded}
            aria-controls="quick-prompts-list"
          >
            <span>Quick prompts</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isQuickPromptsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isQuickPromptsExpanded && (
            <div id="quick-prompts-list" className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  disabled={disabled || isLoading}
                  className="px-3 py-1.5 text-xs bg-white border border-[#E7E1E2] rounded-lg hover:border-[#F24B57] hover:bg-[#F24B57]/5 transition-all text-[#161010] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Composer */}
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Start typing..."
              disabled={disabled || isLoading}
              className="w-full h-full px-3 py-1.5 pr-10 border border-[#E7E1E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F24B57]/20 focus:border-[#F24B57] resize-none text-sm text-[#161010] placeholder:text-[#161010]/40 disabled:bg-[#F9F9F9] disabled:cursor-not-allowed transition-all bg-white"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            className="px-3 py-1.5 bg-[#F24B57] text-white rounded-lg hover:bg-[#F24B57]/90 disabled:bg-[#E7E1E2] disabled:text-[#161010]/30 disabled:cursor-not-allowed transition-all flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            title={disabled ? "Cannot send while reviewing proposal" : "Send message (Enter)"}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Chat?"
        message="Are you sure you want to clear all messages? This action cannot be undone."
        confirmLabel="Clear Chat"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearChat}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
