const DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: ["429", "rate_limit", "timeout", "ECONNRESET", "ETIMEDOUT"],
};
/**
 * Checks if an error is retryable based on error message or status code
 */
function isRetryableError(error, retryableErrors) {
    if (!error)
        return false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = errorMessage.toLowerCase();
    return retryableErrors.some((retryable) => errorString.includes(retryable.toLowerCase()));
}
/**
 * Calculates delay for exponential backoff
 */
function calculateDelay(attempt, options) {
    const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
    return Math.min(delay, options.maxDelayMs);
}
/**
 * Retries a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 */
export async function retryWithBackoff(fn, options = {}) {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry if it's the last attempt
            if (attempt === config.maxRetries) {
                break;
            }
            // Don't retry if error is not retryable
            if (!isRetryableError(error, config.retryableErrors)) {
                throw error;
            }
            // Calculate delay and wait
            const delay = calculateDelay(attempt, config);
            console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms. Error: ${error instanceof Error ? error.message : String(error)}`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    // If we get here, all retries failed
    throw new Error(`Failed after ${config.maxRetries + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
//# sourceMappingURL=retry.js.map