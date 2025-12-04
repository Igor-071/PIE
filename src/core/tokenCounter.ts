/**
 * Rough estimation: 1 token ≈ 3.5 characters for English text
 * This is a more conservative estimate for better accuracy
 * Actual tokenization may vary, but this prevents underestimation
 */
const CHARS_PER_TOKEN = 3.5;

/**
 * Estimates the number of tokens in a text string
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Maximum tokens for GPT-4o-mini context window (approximate)
 * Leaving room for system prompt, response, and safety margin
 */
const MAX_CONTEXT_TOKENS = 120000; // GPT-4o-mini has ~128k context, leave safety margin
const MAX_EVIDENCE_TOKENS = MAX_CONTEXT_TOKENS - 10000; // Reserve 10k for prompts and response
const MAX_EVIDENCE_TOKENS_TIER2 = 80000; // More aggressive limit for Tier 2 business strategy

/**
 * Priority weights for different evidence types
 * Higher priority evidence is included first when chunking
 */
const EVIDENCE_PRIORITY: Record<string, number> = {
  uploaded_brief: 10,      // Client briefs are highest priority
  repo_readme: 10,         // README often contains mission/vision
  package_metadata: 9,     // Project metadata reveals domain
  repo_docs: 8,            // Documentation has business context
  code_summary: 7,         // High-level code analysis
  config_file: 5,          // Config files (Tier 3)
  component_analysis: 4,   // Component details (Tier 3)
  test_file: 3,            // Test files (Tier 3)
  code_patterns: 2,        // Code patterns (Tier 3)
  auth_patterns: 2,        // Auth patterns (Tier 3)
};

/**
 * Chunks evidence documents to fit within token limits with priority-based sorting
 * @param evidence - Array of evidence documents
 * @param maxTokens - Maximum tokens allowed (default: MAX_EVIDENCE_TOKENS)
 * @param tier2Mode - If true, uses more aggressive limits for business strategy analysis
 * @returns Chunked evidence that fits within token limit
 */
export function chunkEvidence(
  evidence: Array<{ id: string; title: string; content: string; type: string }>,
  maxTokens: number = MAX_EVIDENCE_TOKENS,
  tier2Mode: boolean = false
): Array<{ id: string; title: string; content: string; type: string }> {
  // Use more aggressive limit for Tier 2
  const effectiveMaxTokens = tier2Mode ? MAX_EVIDENCE_TOKENS_TIER2 : maxTokens;
  
  // Sort evidence by priority (highest first)
  const sortedEvidence = [...evidence].sort((a, b) => {
    const priorityA = EVIDENCE_PRIORITY[a.type] || 0;
    const priorityB = EVIDENCE_PRIORITY[b.type] || 0;
    return priorityB - priorityA; // Higher priority first
  });
  
  let totalTokens = 0;
  const chunked: Array<{ id: string; title: string; content: string; type: string }> = [];

  for (const doc of sortedEvidence) {
    const docTokens = estimateTokens(doc.content);
    
    // If adding this document would exceed the limit, truncate it
    if (totalTokens + docTokens > effectiveMaxTokens) {
      const remainingTokens = effectiveMaxTokens - totalTokens;
      if (remainingTokens > 100) { // Only add if we have meaningful space left
        const maxChars = Math.floor(remainingTokens * CHARS_PER_TOKEN);
        const truncatedContent = doc.content.substring(0, maxChars) + 
          `\n\n[Content truncated - ${Math.ceil((doc.content.length - maxChars) / 1024)}KB remaining]`;
        chunked.push({
          ...doc,
          content: truncatedContent,
        });
      }
      break; // Stop adding documents once we hit the limit
    }
    
    chunked.push(doc);
    totalTokens += docTokens;
  }
  
  console.log(`[TokenCounter] Chunked ${chunked.length}/${evidence.length} documents, ~${totalTokens} tokens (limit: ${effectiveMaxTokens})`);

  return chunked;
}

/**
 * Truncates text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated text with indicator
 */
export function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars) + `\n\n[Content truncated - ${text.length - maxChars} characters remaining]`;
}

