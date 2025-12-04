import { PrdJson, QuestionsForClient } from "../models/schema.js";
import { EvidenceDocument } from "./evidenceCollector.js";
export interface Tier2Result {
    updatedJson: PrdJson;
    questionsForClient: QuestionsForClient;
}
export interface Tier2AgentOptions {
    maxQuestions?: number;
    model?: string;
}
/**
 * Runs the Tier 2 AI agent to fill strategic fields in the PRD JSON
 * @param baseJson - Initial PRD JSON with Tier 1 data populated
 * @param evidence - Evidence documents collected from the repository
 * @param options - Options including maxQuestions and model
 * @returns Promise resolving to Tier2Result with updated JSON and questions
 */
export declare function runTier2Agent(baseJson: PrdJson, evidence: EvidenceDocument[], options?: Tier2AgentOptions): Promise<Tier2Result>;
//# sourceMappingURL=tier2Agent.d.ts.map