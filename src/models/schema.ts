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
// EXECUTIVE SUMMARY
// ============================================================================

export interface ExecutiveSummary {
  overview?: string;
  problemStatement?: string;
  solutionHighlights?: string;
  keyDifferentiators?: string[];
  targetMarket?: string;
  strategicGoals?: string[];
  technicalApproach?: string;
  riskOverview?: string;
  visionStatement?: string;
}

// ============================================================================
// ROOT PRD SCHEMA
// ============================================================================

export interface PrdJson {
  project: Project;
  executiveSummary?: ExecutiveSummary;
  brandFoundations?: BrandFoundations;
  targetAudience?: TargetAudience[];
  desiredEmotions?: string[];
  positioningAndMessaging?: PositioningAndMessaging;
  visualIdentity?: VisualIdentity;
  brandAssets?: BrandAssets;
  competitiveAnalysis?: CompetitiveAnalysis | EnhancedCompetitiveAnalysis;
  webAndContentNotes?: WebAndContentNotes;
  problemDefinition?: ProblemDefinition;
  solutionOverview?: SolutionOverview;
  customerProfiles?: CustomerProfiles;
  leanCanvas?: LeanCanvas;
  goalsAndSuccessCriteria?: GoalsAndSuccessCriteria;
  mvpScope?: MvpScope;
  assumptions?: Assumptions;
  dependencies?: Dependencies | EnhancedDependencies;
  roleDefinition?: RoleDefinition;
  productRequirements?: ProductRequirement[];
  criticalUserFlows?: CriticalUserFlow[] | EnhancedCriticalUserFlow[];
  technicalRequirements?: TechnicalRequirement[];
  nonFunctionalRequirements?: NonFunctionalRequirement[];
  riskManagement?: RiskManagement;
  openQuestions?: OpenQuestions;
  screens?: Screen[];
  components?: Component[];
  navigation?: Navigation[];
  userJourneys?: UserJourney[];
  flowDiagram?: FlowDiagram;
  dataModel?: DataModel | EnhancedDataModel;
  api?: ApiEndpoint[];
  state?: State;
  events?: Event[];
  aiMetadata?: AiMetadata;
  metadata?: Metadata;
  // Enhanced PRD sections
  documentMetadata?: DocumentMetadata;
  deliveryTimeline?: DeliveryTimeline;
  launchPlan?: LaunchPlan;
  stakeholdersAndRaci?: StakeholdersAndRaci;
  designRequirements?: DesignRequirements;
  testingStrategy?: TestingStrategy;
  deploymentStrategy?: DeploymentStrategy;
  analyticsAndMonitoring?: AnalyticsAndMonitoring;
  glossary?: Glossary;
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

// ============================================================================
// GOALS & SUCCESS CRITERIA
// ============================================================================

export interface SuccessMetric {
  name: string;
  description: string;
  target?: string;
  measurementMethod?: string;
}

export interface GoalsAndSuccessCriteria {
  primaryGoals?: string[];
  successMetrics?: SuccessMetric[];
  kpis?: string[];
}

// ============================================================================
// MVP SCOPE
// ============================================================================

export interface MvpFeature {
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
  screens?: string[];
  dependencies?: string[];
}

export interface MvpScope {
  phase?: string;
  features?: MvpFeature[];
  outOfScope?: string[];
}

// ============================================================================
// ASSUMPTIONS
// ============================================================================

export interface Assumptions {
  technical?: string[];
  operational?: string[];
  financial?: string[];
  legal?: string[];
}

// ============================================================================
// DEPENDENCIES
// ============================================================================

export interface ServiceDependency {
  name: string;
  description: string;
  impact?: string;
}

export interface OperationalDependency {
  description: string;
  requirement?: string;
}

export interface ContentDependency {
  description: string;
  source?: string;
}

export interface Dependencies {
  service?: ServiceDependency[];
  operational?: OperationalDependency[];
  content?: ContentDependency[];
}

// ============================================================================
// ROLE DEFINITION & ACCESS MODEL
// ============================================================================

export interface AccessMatrix {
  feature: string;
  // Roles are project-specific and defined dynamically via the index signature
  // Examples: admin, user, viewer, superAdmin, medicalProvider, patient, reception, etc.
  [roleId: string]: string | undefined; // Dynamic role permissions (e.g., "admin": "CRUD", "user": "Read/Update")
}

export interface RoleDefinition {
  roles?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  accessMatrix?: AccessMatrix[];
}

// ============================================================================
// PRODUCT REQUIREMENTS & ACCEPTANCE CRITERIA
// ============================================================================

export interface AcceptanceCriteria {
  id: string;
  description: string;
  testable?: boolean;
}

export interface ProductRequirement {
  module: string;
  objective: string;
  features: Array<{
    name: string;
    description: string;
    acceptanceCriteria: AcceptanceCriteria[];
  }>;
}

// ============================================================================
// USER FLOWS (Enhanced)
// ============================================================================

export interface UserFlowStep {
  stepNumber: number;
  action: string;
  screen?: string;
  systemResponse?: string;
  painPoint?: string;
}

export interface CriticalUserFlow {
  id: string;
  name: string;
  role: string;
  goal: string;
  steps: UserFlowStep[];
}

// ============================================================================
// RISK MANAGEMENT
// ============================================================================

export interface Risk {
  id: string;
  description: string;
  category: "operational" | "technical" | "security" | "legal" | "financial";
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  mitigationStrategy?: string;
}

export interface RiskManagement {
  risks?: Risk[];
}

// ============================================================================
// TECHNICAL REQUIREMENTS
// ============================================================================

export interface TechnicalRequirement {
  category: "infrastructure" | "architecture" | "dataManagement" | "integration";
  requirements: string[];
  details?: Record<string, string>;
}

// ============================================================================
// NON-FUNCTIONAL REQUIREMENTS
// ============================================================================

export interface NonFunctionalRequirement {
  category: "performance" | "security" | "usability" | "reliability" | "scalability";
  requirements: string[];
  metrics?: Record<string, string>;
}

// ============================================================================
// OPEN QUESTIONS & DECISIONS
// ============================================================================

export interface OpenQuestion {
  id: string;
  question: string;
  category?: "client" | "technical" | "operational" | "legal";
  priority?: "high" | "medium" | "low";
  context?: string;
}

export interface OpenQuestions {
  questions?: OpenQuestion[];
  decisions?: Array<{
    id: string;
    decision: string;
    rationale?: string;
    date?: string;
  }>;
}

// ============================================================================
// ENHANCED PRD SECTIONS
// ============================================================================

// Document Metadata
export interface DocumentMetadata {
  documentOwner?: string;
  stakeholders?: string[];
  collaborators?: string[];
  referenceDocuments?: string[];
  jiraLink?: string;
  trdLink?: string;
  lastUpdated?: string;
  status?: "Draft" | "Review" | "Approved";
}

// Enhanced Persona
export interface EnhancedPersona extends TargetAudience {
  techSavviness?: string;
  preferredCommunicationChannels?: string[];
  userScenarios?: string[];
  motivations?: string[];
  frustrations?: string[];
  behavioralPatterns?: string[];
}

// Enhanced Success Metric
export interface EnhancedSuccessMetric extends SuccessMetric {
  baseline?: string;
  measurementFrequency?: string;
  dataSource?: string;
  owner?: string;
  reviewCadence?: string;
}

// Enhanced Acceptance Criteria
export interface EnhancedAcceptanceCriteria extends AcceptanceCriteria {
  edgeCases?: string[];
  errorScenarios?: string[];
  validationRules?: string[];
  performanceRequirements?: string[];
  accessibilityRequirements?: string[];
}

// Enhanced User Flow
export interface EnhancedUserFlowStep extends UserFlowStep {
  loadingState?: string;
  successState?: string;
  errorState?: string;
  alternativePath?: boolean;
}

export interface EnhancedCriticalUserFlow extends CriticalUserFlow {
  steps: EnhancedUserFlowStep[];
  alternativePaths?: Array<{
    name: string;
    steps: EnhancedUserFlowStep[];
  }>;
  errorScenarios?: Array<{
    scenario: string;
    handling: string;
  }>;
  edgeCases?: string[];
}

// Enhanced Risk
export interface EnhancedRisk extends Risk {
  riskOwner?: string;
  contingencyPlan?: string;
  monitoringIndicators?: string[];
  reviewFrequency?: string;
  escalationPath?: string;
}

// Enhanced Dependency
export interface EnhancedServiceDependency extends ServiceDependency {
  slaRequirements?: string;
  versionConstraints?: string;
  fallbackOptions?: string[];
  integrationTestingRequirements?: string[];
  supportContact?: string;
}

export interface EnhancedDependencies extends Dependencies {
  service?: EnhancedServiceDependency[];
}

// Enhanced Access Matrix
export interface EnhancedAccessMatrix {
  feature: string;
  // Roles are project-specific and defined dynamically via the index signature
  // Examples: admin, user, viewer, superAdmin, medicalProvider, patient, reception, etc.
  [roleId: string]: string | undefined | Record<string, {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    approve?: boolean;
  }>;
  detailedPermissions?: Record<string, {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    approve?: boolean;
  }>;
}

// Competitive Analysis Competitor
export interface Competitor {
  name: string;
  strengths?: string[];
  weaknesses?: string[];
  marketPosition?: string;
  keyDifferentiators?: string[];
}

export interface EnhancedCompetitiveAnalysis {
  marketCategory?: string;
  positioningSummary?: string;
  comparativeDimensions?: string[];
  competitors?: Competitor[] | string[]; // Support both formats
  differentiationStrategy?: DifferentiationStrategy;
  visualReferences?: string[];
}

// Delivery Timeline & Cost
export interface DevelopmentPhase {
  name: string;
  duration: string;
  teamSize: Record<string, number>;
  deliverables: string[];
  milestones: Array<{
    week: number;
    milestone: string;
  }>;
  costEstimate: {
    min: number;
    max: number;
  };
}

export interface DeliveryTimeline {
  phases?: DevelopmentPhase[];
  totalCost?: {
    labor: { min: number; max: number };
    infrastructure: { annual: { min: number; max: number } };
    thirdPartyServices?: { annual: number };
  };
  resourceAllocation?: Record<string, number>;
  timelineDependencies?: Array<{
    week: number;
    dependency: string;
  }>;
  riskFactors?: string[];
}

// Launch Plan
export interface LaunchStrategy {
  approach: string;
  phases: Array<{
    name: string;
    duration: string;
    description: string;
  }>;
}

export interface GoToMarketPlan {
  preLaunch?: {
    marketingActivities?: Array<{ activity: string; timeline: string }>;
    partnershipDevelopment?: string[];
  };
  launchWeek?: {
    activities?: string[];
  };
  postLaunch?: {
    activities?: string[];
  };
}

export interface UserOnboardingStrategy {
  provider?: {
    steps: Array<{ step: number; description: string }>;
  };
  patient?: {
    steps: Array<{ step: number; description: string }>;
  };
}

export interface LaunchPlan {
  launchStrategy?: LaunchStrategy;
  goToMarketPlan?: GoToMarketPlan;
  userOnboardingStrategy?: UserOnboardingStrategy;
  successCriteria?: Record<string, {
    week1?: Record<string, string>;
    month1?: Record<string, string>;
    month3?: Record<string, string>;
  }>;
  rollbackPlan?: {
    triggerConditions?: string[];
    procedure?: Array<{ phase: string; actions: string[]; timeline: string }>;
    contacts?: Record<string, string>;
  };
}

// Stakeholders & RACI
export interface Stakeholder {
  name: string;
  role: string;
  influence: "low" | "medium" | "high";
  interest: "low" | "medium" | "high";
  engagementLevel: string;
}

export interface RaciActivity {
  activity: string;
  responsible?: string[];
  accountable?: string[];
  consulted?: string[];
  informed?: string[];
}

export interface DecisionMakingAuthority {
  decisionType: string;
  decisionMaker: string;
  consultationRequired?: string[];
}

export interface CommunicationPlan {
  daily?: Array<{ meeting: string; time: string; attendees: string[] }>;
  weekly?: Array<{ meeting: string; day: string; time: string; attendees: string[] }>;
  biWeekly?: Array<{ meeting: string; schedule: string; attendees: string[] }>;
  monthly?: Array<{ meeting: string; schedule: string; attendees: string[] }>;
  adHoc?: Array<{ trigger: string; response: string }>;
}

export interface StakeholdersAndRaci {
  stakeholders?: Stakeholder[];
  raciChart?: RaciActivity[];
  decisionMakingAuthority?: DecisionMakingAuthority[];
  communicationPlan?: CommunicationPlan;
}

// Design Requirements
export interface DesignSystem {
  componentLibrary?: string;
  designTokens?: {
    primaryColor?: string;
    secondaryColor?: string;
    errorColor?: string;
    warningColor?: string;
    successColor?: string;
    neutralColors?: string[];
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    fontSizes?: string[];
  };
  spacingScale?: string;
  borderRadius?: Record<string, string>;
}

export interface AccessibilityRequirements {
  wcagLevel?: string;
  colorContrast?: string;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
  focusIndicators?: boolean;
  altText?: boolean;
  formLabels?: boolean;
  errorIdentification?: boolean;
  testing?: string[];
}

export interface ResponsiveBreakpoints {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  largeDesktop?: string;
}

export interface DesignRequirements {
  designSystem?: DesignSystem;
  uiUxGuidelines?: {
    layoutPrinciples?: string[];
    interactionPatterns?: string[];
    contentGuidelines?: string[];
  };
  accessibilityRequirements?: AccessibilityRequirements;
  responsiveBreakpoints?: ResponsiveBreakpoints;
  componentLibraryReferences?: Record<string, string[]>;
  brandGuidelinesCompliance?: string[];
}

// Enhanced Data Models
export interface EnhancedDataModelField extends DataModelField {
  constraints?: string[];
  description?: string;
  validationRules?: string[];
}

export interface EnhancedDataModelEntity {
  fields: Record<string, EnhancedDataModelField>;
  relationships?: DataModelRelationship[];
  indexes?: Array<{
    type: string;
    fields: string[];
  }>;
  validationRules?: string[];
}

export interface EnhancedDataModel {
  entities?: Record<string, EnhancedDataModelEntity>;
  entityRelationships?: Array<{
    from: string;
    to: string;
    relationship: string;
  }>;
  dataRetentionPolicies?: Record<string, string>;
  dataMigrationRequirements?: {
    sourceSystems?: string[];
    migrationApproach?: string;
    dataValidation?: string[];
    rollbackPlan?: string;
    timeline?: string;
  };
}

// Testing Strategy
export interface TestCoverageRequirements {
  targetCoverage?: string;
  unitTests?: string;
  integrationTests?: string;
  e2eTests?: string;
}

export interface TestingType {
  name: string;
  framework?: string;
  scope?: string[];
  requirements?: string[];
}

export interface TestDataRequirements {
  testDataSets?: string[];
  dataPrivacy?: string[];
}

export interface QaProcess {
  testPlanning?: string[];
  testExecution?: string[];
  bugTracking?: string[];
  testReporting?: string[];
}

export interface TestingStrategy {
  testCoverageRequirements?: TestCoverageRequirements;
  testingTypes?: TestingType[];
  testDataRequirements?: TestDataRequirements;
  qaProcess?: QaProcess;
}

// Deployment Strategy
export interface DeploymentApproach {
  strategy: string;
  rationale?: string;
}

export interface DeploymentProcess {
  preDeployment?: string[];
  deploymentSteps?: string[];
  rollbackProcedure?: string[];
}

export interface EnvironmentSetup {
  environments?: Record<string, string>;
  environmentVariables?: string[];
}

export interface CiCdPipeline {
  pipelineStages?: string[];
  tools?: string[];
}

export interface MonitoringAndRollbackTriggers {
  automatedRollbackTriggers?: string[];
  manualRollbackTriggers?: string[];
}

export interface DeploymentStrategy {
  deploymentApproach?: DeploymentApproach;
  deploymentProcess?: DeploymentProcess;
  environmentSetup?: EnvironmentSetup;
  ciCdPipeline?: CiCdPipeline;
  monitoringAndRollbackTriggers?: MonitoringAndRollbackTriggers;
}

// Analytics & Monitoring Requirements
export interface KeyMetrics {
  userMetrics?: string[];
  featureUsageMetrics?: string[];
  performanceMetrics?: string[];
  businessMetrics?: string[];
}

export interface DashboardRequirements {
  executive?: string[];
  product?: string[];
  engineering?: string[];
}

export interface AlertingThresholds {
  critical?: Array<{ condition: string; notification: string }>;
  warning?: Array<{ condition: string; notification: string }>;
  info?: Array<{ condition: string; notification: string }>;
}

export interface LoggingRequirements {
  applicationLogging?: string[];
  logLevels?: Record<string, string>;
  logRetention?: Record<string, string>;
  logAggregation?: string[];
}

export interface AnalyticsAndMonitoring {
  keyMetrics?: KeyMetrics;
  dashboardRequirements?: DashboardRequirements;
  alertingThresholds?: AlertingThresholds;
  loggingRequirements?: LoggingRequirements;
}

// Glossary
export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Glossary {
  terms?: GlossaryTerm[];
}
