import {
  Tier1Data,
  PrdJson,
  BrandFoundations,
  PositioningAndMessaging,
  CompetitiveAnalysis,
  LeanCanvas,
  ProblemDefinition,
  SolutionOverview,
  StrategicText,
} from "../models/schema.js";

/**
 * Creates an empty StrategicText with default values
 */
function emptyStrategicText(sourceType: StrategicText["sourceType"] = "model_inference"): StrategicText {
  return {
    value: null,
    confidence: "unknown",
    sourceType,
  };
}

/**
 * Builds initial PRD JSON structure from Tier 1 data
 * @param tier1 - Tier 1 technical data extracted from code
 * @returns PrdJson with Tier 1 populated and Tier 2 initialized with empty structures
 */
export function buildInitialPrdJsonFromTier1(tier1: Tier1Data): PrdJson {
  // Initialize empty BrandFoundations
  const brandFoundations: BrandFoundations = {
    mission: emptyStrategicText(),
    vision: emptyStrategicText(),
    values: emptyStrategicText(),
    brandPersonality: emptyStrategicText(),
  };

  // Initialize empty PositioningAndMessaging
  const positioningAndMessaging: PositioningAndMessaging = {
    positioning: emptyStrategicText(),
    keyMessages: emptyStrategicText(),
    toneOfVoice: emptyStrategicText(),
    uniqueSellingProposition: emptyStrategicText(),
  };

  // Initialize empty CompetitiveAnalysis
  const competitiveAnalysis: CompetitiveAnalysis = {
    competitors: [],
    marketPosition: emptyStrategicText(),
    competitiveAdvantages: emptyStrategicText(),
  };

  // Initialize empty LeanCanvas
  const leanCanvas: LeanCanvas = {
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
  const problemDefinition: ProblemDefinition = {
    problemStatement: emptyStrategicText(),
    problemValidation: emptyStrategicText(),
    affectedUsers: emptyStrategicText(),
    impact: emptyStrategicText(),
  };

  // Initialize empty SolutionOverview
  const solutionOverview: SolutionOverview = {
    valueProposition: emptyStrategicText(),
    keyFeatures: emptyStrategicText(),
    benefits: emptyStrategicText(),
    successMetrics: emptyStrategicText(),
  };

  return {
    tier1,
    tier2: {
      brandFoundations,
      targetAudience: [], // Empty array, will be populated by Tier 2 agent
      positioningAndMessaging,
      competitiveAnalysis,
      leanCanvas,
      customerProfiles: [], // Empty array, will be populated by Tier 2 agent
      problemDefinition,
      solutionOverview,
    },
    metadata: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      generatorVersion: "0.1.0",
    },
  };
}
