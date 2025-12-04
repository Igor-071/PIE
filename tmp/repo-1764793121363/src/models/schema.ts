// Confidence + source tracking for all Tier 2 strategic fields
export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type SourceType =
  | "uploaded_brief"
  | "repo_readme"
  | "repo_docs"
  | "website"
  | "client_answer"
  | "model_inference"
  | "other";

export interface StrategicText {
  value: string | null;
  confidence: ConfidenceLevel;
  sourceType: SourceType;
  sources?: string[];
  notes?: string;
}

// ============================================================================
// TIER 1 - Technical Fields (extracted from code)
// ============================================================================

export interface Screen {
  name: string;
  path: string;
  component?: string;
  framework?: string;
}

export interface NavigationItem {
  label: string;
  path: string;
  children?: NavigationItem[];
}

export interface ApiEndpoint {
  method: string;
  path: string;
  handler?: string;
  framework?: string;
}

export interface DataModel {
  name: string;
  type: string; // e.g., "prisma", "mongoose", "typeorm", "json"
  schema?: Record<string, unknown>;
  location?: string;
}

export interface StatePattern {
  type: string; // e.g., "redux", "zustand", "context", "recoil"
  stores?: string[];
  location?: string;
}

export interface Event {
  name: string;
  type?: string;
  handler?: string;
  location?: string;
}

export interface AiMetadata {
  extractedAt: string;
  stackDetected: string[];
  missingPieces: string[];
  extractionNotes: string[];
  tier1Confidence: ConfidenceLevel;
}

export interface Tier1Data {
  projectName: string;
  screens: Screen[];
  navigation: NavigationItem[];
  apiEndpoints: ApiEndpoint[];
  dataModels: DataModel[];
  statePatterns: StatePattern[];
  events: Event[];
  aiMetadata: AiMetadata;
}

// ============================================================================
// TIER 2 - Strategic Fields (filled by LLM agent)
// ============================================================================

export interface BrandFoundations {
  mission: StrategicText;
  vision: StrategicText;
  values: StrategicText;
  brandPersonality: StrategicText;
}

export interface TargetAudience {
  segment: StrategicText;
  demographics: StrategicText;
  psychographics: StrategicText;
  painPoints: StrategicText;
  goals: StrategicText;
}

export interface PositioningAndMessaging {
  positioning: StrategicText;
  keyMessages: StrategicText;
  toneOfVoice: StrategicText;
  uniqueSellingProposition: StrategicText;
}

export interface Competitor {
  name: StrategicText;
  strengths: StrategicText;
  weaknesses: StrategicText;
  differentiation: StrategicText;
}

export interface CompetitiveAnalysis {
  competitors: Competitor[];
  marketPosition: StrategicText;
  competitiveAdvantages: StrategicText;
}

export interface LeanCanvas {
  problem: StrategicText;
  solution: StrategicText;
  keyMetrics: StrategicText;
  uniqueValueProposition: StrategicText;
  unfairAdvantage: StrategicText;
  channels: StrategicText;
  customerSegments: StrategicText;
  costStructure: StrategicText;
  revenueStreams: StrategicText;
}

export interface CustomerProfile {
  name: StrategicText;
  role: StrategicText;
  goals: StrategicText;
  challenges: StrategicText;
  behaviors: StrategicText;
  needs: StrategicText;
}

export interface ProblemDefinition {
  problemStatement: StrategicText;
  problemValidation: StrategicText;
  affectedUsers: StrategicText;
  impact: StrategicText;
}

export interface SolutionOverview {
  valueProposition: StrategicText;
  keyFeatures: StrategicText;
  benefits: StrategicText;
  successMetrics: StrategicText;
}

// ============================================================================
// Root PRD JSON Structure
// ============================================================================

export interface PrdJson {
  // Tier 1 - Technical (from code analysis)
  tier1: Tier1Data;

  // Tier 2 - Strategic (from LLM agent)
  tier2: {
    brandFoundations: BrandFoundations;
    targetAudience: TargetAudience[];
    positioningAndMessaging: PositioningAndMessaging;
    competitiveAnalysis: CompetitiveAnalysis;
    leanCanvas: LeanCanvas;
    customerProfiles: CustomerProfile[];
    problemDefinition: ProblemDefinition;
    solutionOverview: SolutionOverview;
  };

  // Metadata
  metadata: {
    version: string;
    generatedAt: string;
    generatorVersion: string;
  };
}

// ============================================================================
// Helper Types
// ============================================================================

export interface ClientQuestion {
  field: string;
  question: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface QuestionsForClient {
  questions: ClientQuestion[];
  generatedAt: string;
}
