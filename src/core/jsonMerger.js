"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInitialPrdJsonFromTier1 = buildInitialPrdJsonFromTier1;
/**
 * Creates an empty StrategicText with default values
 */
function emptyStrategicText(sourceType) {
    if (sourceType === void 0) { sourceType = "model_inference"; }
    return {
        value: null,
        confidence: "unknown",
        sourceType: sourceType,
    };
}
/**
 * Builds initial PRD JSON structure from Tier 1 data
 * @param tier1 - Tier 1 technical data extracted from code
 * @returns PrdJson with Tier 1 populated and Tier 2 initialized with empty structures
 */
function buildInitialPrdJsonFromTier1(tier1) {
    // Initialize empty BrandFoundations
    var brandFoundations = {
        mission: emptyStrategicText(),
        vision: emptyStrategicText(),
        values: emptyStrategicText(),
        brandPersonality: emptyStrategicText(),
    };
    // Initialize empty PositioningAndMessaging
    var positioningAndMessaging = {
        positioning: emptyStrategicText(),
        keyMessages: emptyStrategicText(),
        toneOfVoice: emptyStrategicText(),
        uniqueSellingProposition: emptyStrategicText(),
    };
    // Initialize empty CompetitiveAnalysis
    var competitiveAnalysis = {
        competitors: [],
        marketPosition: emptyStrategicText(),
        competitiveAdvantages: emptyStrategicText(),
    };
    // Initialize empty LeanCanvas
    var leanCanvas = {
        problem: emptyStrategicText(),
        solution: emptyStrategicText(),
        keyMetrics: emptyStrategicText(),
        uniqueValueProposition: emptyStrategicText(),
        unfairAdvantage: emptyStrategicText(),
        channels: emptyStrategicText(),
        customerSegments: emptyStrategicText(),
        costStructure: emptyStrategicText(),
        revenueStreams: emptyStrategicText(),
    };
    // Initialize empty ProblemDefinition
    var problemDefinition = {
        problemStatement: emptyStrategicText(),
        problemValidation: emptyStrategicText(),
        affectedUsers: emptyStrategicText(),
        impact: emptyStrategicText(),
    };
    // Initialize empty SolutionOverview
    var solutionOverview = {
        valueProposition: emptyStrategicText(),
        keyFeatures: emptyStrategicText(),
        benefits: emptyStrategicText(),
        successMetrics: emptyStrategicText(),
    };
    return {
        tier1: tier1,
        tier2: {
            brandFoundations: brandFoundations,
            targetAudience: [], // Empty array, will be populated by Tier 2 agent
            positioningAndMessaging: positioningAndMessaging,
            competitiveAnalysis: competitiveAnalysis,
            leanCanvas: leanCanvas,
            customerProfiles: [], // Empty array, will be populated by Tier 2 agent
            problemDefinition: problemDefinition,
            solutionOverview: solutionOverview,
        },
        metadata: {
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            generatorVersion: "0.1.0",
        },
    };
}
