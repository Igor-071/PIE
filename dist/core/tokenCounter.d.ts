/**
 * Estimates the number of tokens in a text string
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export declare function estimateTokens(text: string): number;
/**
 * Chunks evidence documents to fit within token limits
 * @param evidence - Array of evidence documents
 * @param maxTokens - Maximum tokens allowed (default: MAX_EVIDENCE_TOKENS)
 * @returns Chunked evidence that fits within token limit
 */
export declare function chunkEvidence(evidence: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
}>, maxTokens?: number): Array<{
    id: string;
    title: string;
    content: string;
    type: string;
}>;
/**
 * Truncates text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated text with indicator
 */
export declare function truncateText(text: string, maxTokens: number): string;
//# sourceMappingURL=tokenCounter.d.ts.map