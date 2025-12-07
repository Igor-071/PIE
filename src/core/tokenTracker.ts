/**
 * Token Usage Tracker
 * Tracks actual token usage from OpenAI API responses
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsageByPhase {
  phase: string;
  usage: TokenUsage;
  timestamp: number;
}

export interface TokenUsageSummary {
  total: TokenUsage;
  byPhase: TokenUsageByPhase[];
  estimatedTotal: number; // Estimated tokens before API call
  actualTotal: number; // Actual tokens from API responses
  accuracy: number; // Percentage accuracy of estimates (0-100)
}

/**
 * Creates a new token usage tracker
 */
export class TokenTracker {
  private usageByPhase: TokenUsageByPhase[] = [];
  private estimatedTokens: number = 0;

  /**
   * Records token usage for a specific phase
   */
  recordUsage(phase: string, usage: TokenUsage, estimatedTokens?: number): void {
    this.usageByPhase.push({
      phase,
      usage,
      timestamp: Date.now(),
    });

    if (estimatedTokens !== undefined) {
      this.estimatedTokens += estimatedTokens;
    }
  }

  /**
   * Records estimated tokens (before API call)
   */
  recordEstimate(tokens: number): void {
    this.estimatedTokens += tokens;
  }

  /**
   * Gets the summary of token usage
   */
  getSummary(): TokenUsageSummary {
    const total: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    this.usageByPhase.forEach((phase) => {
      total.promptTokens += phase.usage.promptTokens;
      total.completionTokens += phase.usage.completionTokens;
      total.totalTokens += phase.usage.totalTokens;
    });

    const actualTotal = total.totalTokens;
    const accuracy =
      this.estimatedTokens > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (1 - Math.abs(actualTotal - this.estimatedTokens) / this.estimatedTokens) * 100
            )
          )
        : 100;

    return {
      total,
      byPhase: [...this.usageByPhase],
      estimatedTotal: this.estimatedTokens,
      actualTotal,
      accuracy,
    };
  }

  /**
   * Resets the tracker
   */
  reset(): void {
    this.usageByPhase = [];
    this.estimatedTokens = 0;
  }

  /**
   * Extracts token usage from OpenAI API response
   */
  static extractFromResponse(response: any): TokenUsage | null {
    if (!response || !response.usage) {
      return null;
    }

    return {
      promptTokens: response.usage.prompt_tokens || 0,
      completionTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0,
    };
  }
}

/**
 * Formats token usage for display
 */
export function formatTokenUsage(usage: TokenUsage): string {
  return `${usage.totalTokens.toLocaleString()} tokens (${usage.promptTokens.toLocaleString()} prompt + ${usage.completionTokens.toLocaleString()} completion)`;
}

/**
 * Formats token usage summary for display
 */
export function formatTokenSummary(summary: TokenUsageSummary): string {
  const parts: string[] = [];
  parts.push(`Total: ${summary.total.totalTokens.toLocaleString()} tokens`);
  parts.push(`Estimated: ${summary.estimatedTotal.toLocaleString()} tokens`);
  parts.push(`Accuracy: ${summary.accuracy.toFixed(1)}%`);

  if (summary.byPhase.length > 0) {
    parts.push(`\nBy Phase:`);
    summary.byPhase.forEach((phase) => {
      parts.push(
        `  ${phase.phase}: ${phase.usage.totalTokens.toLocaleString()} tokens`
      );
    });
  }

  return parts.join("\n");
}

/**
 * Estimates cost based on token usage (for GPT-4-turbo pricing)
 */
export function estimateCost(usage: TokenUsage, model: string = "gpt-4-turbo"): number {
  // Pricing as of 2024 (per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4-turbo": { input: 10.0, output: 30.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4": { input: 30.0, output: 60.0 },
  };

  const modelPricing = pricing[model] || pricing["gpt-4-turbo"];

  const inputCost = (usage.promptTokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completionTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}
