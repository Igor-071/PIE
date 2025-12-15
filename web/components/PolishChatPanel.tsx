"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  hasProposal?: boolean;
}

interface PolishChatPanelProps {
  jobId: string;
  onProposalReceived: (proposal: {
    assistantMessage: string;
    markdownPatch: string;
    jsonPatch: any;
    followUpQuestions?: string[];
  }) => void;
  disabled?: boolean;
}

export default function PolishChatPanel({ 
  jobId, 
  onProposalReceived,
  disabled = false 
}: PolishChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        hasProposal: !!(result.markdownPatch || result.jsonPatch),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there's a proposal, notify parent
      if (result.markdownPatch || result.jsonPatch) {
        onProposalReceived(result);
      }

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#E7E1E2] px-4 py-3">
        <h3 className="font-semibold text-[#161010]">PIE Assistant</h3>
        <p className="text-xs text-[#161010]/60 mt-1">
          Ask to improve clarity, add details, or refine sections
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#161010]/50 py-8">
            <p className="text-sm mb-2">No messages yet</p>
            <p className="text-xs">Try: "Make acceptance criteria more testable"</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-[#F24B57] text-white"
                  : "bg-[#E7E1E2] text-[#161010]"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.hasProposal && (
                <p className="text-xs mt-2 opacity-75">
                  ✨ Proposal ready for review
                </p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#E7E1E2] text-[#161010] rounded-lg px-4 py-2">
              <p className="text-sm">Analyzing and generating proposal...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E7E1E2] px-4 py-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="How can I improve the PRD?"
            disabled={disabled || isLoading}
            className="flex-1 px-3 py-2 border-2 border-[#E7E1E2] rounded-lg focus:ring-2 focus:ring-[#F24B57] focus:border-[#F24B57] resize-none text-[#161010] placeholder:text-[#161010]/50 disabled:bg-[#E7E1E2]/20 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            className="px-4 py-2 bg-[#F24B57] text-white rounded-lg font-medium hover:bg-[#F24B57]/90 disabled:bg-[#E7E1E2] disabled:text-[#161010]/50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
