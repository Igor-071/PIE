import { PrdJson, DataModel } from "../models/schema.js";
/**
 * Builds initial PRD JSON structure from Tier 1 extraction
 * @param tier1 - Tier 1 data with projectName and technical fields
 * @returns Complete PRD JSON with empty Tier 2 fields
 */
export declare function buildInitialPrdJsonFromTier1(tier1: {
    projectName: string;
    screens: any[];
    navigation: any[];
    apiEndpoints: any[];
    dataModels: DataModel;
    statePatterns: any[];
    events: any[];
    aiMetadata: any;
}): PrdJson;
//# sourceMappingURL=jsonMerger.d.ts.map