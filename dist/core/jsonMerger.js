/**
 * Builds initial PRD JSON structure from Tier 1 extraction
 * @param tier1 - Tier 1 data (now already in PrdJson format)
 * @returns Complete PRD JSON with empty Tier 2 fields
 */
export function buildInitialPrdJsonFromTier1(tier1) {
    // tier1 is already in PrdJson format from the new extractTier1 function
    // Just ensure metadata is set
    return {
        ...tier1,
        metadata: {
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            generatorVersion: "0.1.0",
        },
    };
}
//# sourceMappingURL=jsonMerger.js.map