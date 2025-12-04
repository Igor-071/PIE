/**
 * Rough estimation: 1 token ≈ 4 characters for English text
 * This is a conservative estimate - actual tokenization may vary
 */
const CHARS_PER_TOKEN = 4;
/**
 * Estimates the number of tokens in a text string
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text) {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}
/**
 * Maximum tokens for GPT-4o-mini context window (approximate)
 * Leaving room for system prompt, response, and safety margin
 */
const MAX_CONTEXT_TOKENS = 120000; // GPT-4o-mini has ~128k context, leave safety margin
const MAX_EVIDENCE_TOKENS = MAX_CONTEXT_TOKENS - 10000; // Reserve 10k for prompts and response
/**
 * Chunks evidence documents to fit within token limits
 * @param evidence - Array of evidence documents
 * @param maxTokens - Maximum tokens allowed (default: MAX_EVIDENCE_TOKENS)
 * @returns Chunked evidence that fits within token limit
 */
export function chunkEvidence(evidence, maxTokens = MAX_EVIDENCE_TOKENS) {
    let totalTokens = 0;
    const chunked = [];
    for (const doc of evidence) {
        const docTokens = estimateTokens(doc.content);
        // If adding this document would exceed the limit, truncate it
        if (totalTokens + docTokens > maxTokens) {
            const remainingTokens = maxTokens - totalTokens;
            if (remainingTokens > 100) { // Only add if we have meaningful space left
                const maxChars = remainingTokens * CHARS_PER_TOKEN;
                const truncatedContent = doc.content.substring(0, maxChars) +
                    `\n\n[Content truncated - ${doc.content.length - maxChars} characters remaining]`;
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
    return chunked;
}
/**
 * Truncates text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated text with indicator
 */
export function truncateText(text, maxTokens) {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    if (text.length <= maxChars) {
        return text;
    }
    return text.substring(0, maxChars) + `\n\n[Content truncated - ${text.length - maxChars} characters remaining]`;
}
//# sourceMappingURL=tokenCounter.js.map