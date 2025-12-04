import { Screen, ApiEndpoint, DataModel, AiMetadata } from "../models/schema.js";
/**
 * Extracts Tier 1 technical data from a repository
 * @param repoPath - Path to the unzipped repository directory
 * @returns Promise resolving to Tier1Data
 */
export declare function extractTier1(repoPath: string): Promise<{
    projectName: string;
    screens: Screen[];
    navigation: any[];
    apiEndpoints: ApiEndpoint[];
    dataModels: DataModel;
    statePatterns: any[];
    events: any[];
    aiMetadata: AiMetadata;
}>;
//# sourceMappingURL=tier1Extractor.d.ts.map