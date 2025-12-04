/**
 * Retry configuration options
 */
export interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
}
/**
 * Retries a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map