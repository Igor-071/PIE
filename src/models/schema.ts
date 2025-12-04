// Custom PRD Schema based on json template.md
// This schema matches the structure defined in templates/json template.md

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  id: string;
  name: string;
  client?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  date?: string;
  preparedBy?: string;
  description?: string;
}

// ============================================================================
// BRAND FOUNDATIONS
// ============================================================================

export interface BrandFoundations {
  brandDescription?: string;
  mission?: string;
  vision?: string;
  coreValues?: string[];
  problemStatement?: string;
  solutionStatement?: string;
  toneOfVoice?: string[];
  brandEthos?: string;
  brandArchetype?: string;
  brandPromise?: string;
}

// ============================================================================
// TARGET AUDIENCE
// ============================================================================

export interface TargetAudience {
  id: string;
  name: string;
  segment?: string;
  role?: string;
  techComfort?: string;
  demographics?: string;
  psychographics?: string;
  goals?: string[];
  painPoints?: string[];
  behaviours?: string[];
  geography?: string;
  jobsToBeDone?: string[];
}

// ============================================================================
// POSITIONING & MESSAGING
// ============================================================================

export interface PositioningAndMessaging {
  tagline?: string;
  positioningStatement?: string;
  elevatorPitch?: string;
  messagingPillars?: string[];
  coreHooks?: string[];
  narrativeFragments?: string[];
}

// ============================================================================
// VISUAL IDENTITY
// ============================================================================

export interface Typography {
  headingFont?: string;
  bodyFont?: string;
}

export interface DesignInspiration {
  site: string;
  notes?: string;
}

export interface VisualIdentity {
  primaryColor?: string;
  secondaryColors?: string[];
  typography?: Typography;
  logoPrimary?: string;
  logoSecondary?: string;
  symbol?: string;
  imageryGuidelines?: string[];
  designInspiration?: DesignInspiration[];
  mockupExamples?: string[];
}

// ============================================================================
// BRAND ASSETS
// ============================================================================

export interface BrandAssets {
  includedFiles?: string[];
  exportFormat?: string;
  deliveryUrl?: string;
}

// ============================================================================
// COMPETITIVE ANALYSIS
// ============================================================================

export interface DifferentiationStrategy {
  keyOpportunities?: string[];
  uniqueSellingPoints?: string[];
  whiteSpaceInsights?: string;
  blueOceanIndicators?: string[];
}

export interface CompetitiveAnalysis {
  marketCategory?: string;
  positioningSummary?: string;
  comparativeDimensions?: string[];
  competitors?: string[];
  differentiationStrategy?: DifferentiationStrategy;
  visualReferences?: string[];
}

// ============================================================================
// WEB & CONTENT
// ============================================================================

export interface WebAndContentNotes {
  websiteGoals?: string[];
  requiredPages?: string[];
  techRequirements?: string[];
  contentStrategyNotes?: string;
}

// ============================================================================
// PROBLEM DEFINITION
// ============================================================================

export interface ProblemDefinition {
  context?: string;
  primaryProblem?: string;
  secondaryProblems?: string[];
  businessImpact?: string;
  userPainPoints?: string[];
  hypotheses?: string[];
  constraints?: string[];
}

// ============================================================================
// SOLUTION OVERVIEW
// ============================================================================

export interface SolutionOverview {
  valueProposition?: string;
  keyFeatures?: string[];
  differentiators?: string[];
  outOfScopeForNow?: string[];
  nonFunctionalRequirements?: string[];
}

// ============================================================================
// CUSTOMER PROFILES
// ============================================================================

export interface EarlyAdopterProfile {
  description?: string;
  organisationType?: string[];
  teamSizeRange?: string;
  currentTools?: string[];
  triggerEvents?: string[];
  successSignals?: string[];
}

export interface IdealCustomerProfile {
  description?: string;
  organisationType?: string[];
  teamSizeRange?: string;
  regions?: string[];
  budgetRange?: string;
  maturityLevel?: string;
  keyStakeholders?: string[];
}

export interface CustomerProfiles {
  earlyAdopterProfile?: EarlyAdopterProfile;
  idealCustomerProfile?: IdealCustomerProfile;
}

// ============================================================================
// LEAN CANVAS
// ============================================================================

export interface LeanCanvas {
  uniqueValueProposition?: string;
  unfairAdvantage?: string;
  customerSegments?: string[];
  existingAlternatives?: string[];
  keyMetrics?: string[];
  highLevelConcept?: string;
  channels?: string[];
  costStructure?: string[];
  revenueStreams?: string[];
}

// ============================================================================
// SCREENS & COMPONENTS
// ============================================================================

export interface Screen {
  id: string;
  name: string;
  purpose?: string;
  path?: string;
  components?: string[];
  roleIds?: string[];
  framework?: string;
}

export interface ComponentEvent {
  type: string;
  target?: string;
  condition?: string;
}

export interface Component {
  id: string;
  type: string;
  props?: Record<string, any>;
  events?: ComponentEvent[];
}

// ============================================================================
// NAVIGATION
// ============================================================================

export interface Navigation {
  fromScreenId?: string;
  toScreenId?: string;
  event?: string;
  condition?: string;
  // Legacy support
  label?: string;
  path?: string;
  children?: Navigation[];
}

// ============================================================================
// USER JOURNEYS
// ============================================================================

export interface JourneyPhase {
  id: string;
  name: string;
  description?: string;
  touchpoints?: string[];
  userActions?: string[];
  tasks?: string[];
  activities?: string[];
  systemResponses?: string[];
  painPoints?: string[];
  successMetrics?: string[];
}

export interface UserJourney {
  roleId: string;
  roleName: string;
  scope?: string;
  primaryGoal?: string;
  secondaryGoals?: string[];
  phases?: JourneyPhase[];
}

// ============================================================================
// FLOW DIAGRAM
// ============================================================================

export interface FlowNode {
  id: string;
  type: string;
  ref?: string;
  label?: string;
  roleIds?: string[];
  metadata?: Record<string, any>;
}

export interface FlowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface FlowDiagram {
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

// ============================================================================
// DATA MODEL
// ============================================================================

export interface DataModelField {
  type: string;
  required?: boolean;
  unique?: boolean;
}

export interface DataModelRelationship {
  type: string;
  target: string;
  via?: string;
}

export interface DataModelEntity {
  fields: Record<string, DataModelField>;
  relationships?: DataModelRelationship[];
}

export type DataModel = Record<string, DataModelEntity>;

// ============================================================================
// API
// ============================================================================

export interface ApiEndpoint {
  name: string;
  endpoint: string;
  method: string;
  payloadFields?: string[];
  responseFields?: string[];
  authRequired?: boolean;
  // Legacy support
  handler?: string;
  framework?: string;
}

// ============================================================================
// STATE
// ============================================================================

export interface State {
  global?: Record<string, any>;
}

// ============================================================================
// EVENTS
// ============================================================================

export interface Event {
  id: string;
  type: string;
  trigger?: string;
  inputs?: string[];
  outputs?: string[];
  // Legacy support
  name?: string;
  handler?: string;
  location?: string;
}

// ============================================================================
// AI METADATA
// ============================================================================

export interface DataQualityAssessment {
  highConfidence?: string[];
  mediumConfidence?: string[];
  lowConfidence?: string[];
  notAvailable?: string[];
}

export interface MissingInformation {
  fromTier3?: string[];
  potentialSources?: string[];
  recommendation?: string;
}

export interface AiMetadata {
  creationPrompt?: string;
  sourceCodeType?: string;
  extractionSummary?: string;
  dataQualityAssessment?: DataQualityAssessment;
  missingInformation?: MissingInformation;
  assumptions?: string[];
  extractionNotes?: string;
  // Legacy support
  extractedAt?: string;
  stackDetected?: string[];
  missingPieces?: string[];
}

// ============================================================================
// METADATA
// ============================================================================

export interface Metadata {
  version: string;
  generatedAt: string;
  generatorVersion: string;
}

// ============================================================================
// ROOT PRD SCHEMA
// ============================================================================

export interface PrdJson {
  project: Project;
  brandFoundations?: BrandFoundations;
  targetAudience?: TargetAudience[];
  desiredEmotions?: string[];
  positioningAndMessaging?: PositioningAndMessaging;
  visualIdentity?: VisualIdentity;
  brandAssets?: BrandAssets;
  competitiveAnalysis?: CompetitiveAnalysis;
  webAndContentNotes?: WebAndContentNotes;
  problemDefinition?: ProblemDefinition;
  solutionOverview?: SolutionOverview;
  customerProfiles?: CustomerProfiles;
  leanCanvas?: LeanCanvas;
  screens?: Screen[];
  components?: Component[];
  navigation?: Navigation[];
  userJourneys?: UserJourney[];
  flowDiagram?: FlowDiagram;
  dataModel?: DataModel;
  api?: ApiEndpoint[];
  state?: State;
  events?: Event[];
  aiMetadata?: AiMetadata;
  metadata?: Metadata;
}

// ============================================================================
// HELPER TYPES FOR CLIENT QUESTIONS
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
