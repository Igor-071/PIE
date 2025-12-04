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
export interface PositioningAndMessaging {
    tagline?: string;
    positioningStatement?: string;
    elevatorPitch?: string;
    messagingPillars?: string[];
    coreHooks?: string[];
    narrativeFragments?: string[];
}
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
export interface BrandAssets {
    includedFiles?: string[];
    exportFormat?: string;
    deliveryUrl?: string;
}
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
export interface WebAndContentNotes {
    websiteGoals?: string[];
    requiredPages?: string[];
    techRequirements?: string[];
    contentStrategyNotes?: string;
}
export interface ProblemDefinition {
    context?: string;
    primaryProblem?: string;
    secondaryProblems?: string[];
    businessImpact?: string;
    userPainPoints?: string[];
    hypotheses?: string[];
    constraints?: string[];
}
export interface SolutionOverview {
    valueProposition?: string;
    keyFeatures?: string[];
    differentiators?: string[];
    outOfScopeForNow?: string[];
    nonFunctionalRequirements?: string[];
}
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
export interface Navigation {
    fromScreenId?: string;
    toScreenId?: string;
    event?: string;
    condition?: string;
    label?: string;
    path?: string;
    children?: Navigation[];
}
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
export interface ApiEndpoint {
    name: string;
    endpoint: string;
    method: string;
    payloadFields?: string[];
    responseFields?: string[];
    authRequired?: boolean;
    handler?: string;
    framework?: string;
}
export interface State {
    global?: Record<string, any>;
}
export interface Event {
    id: string;
    type: string;
    trigger?: string;
    inputs?: string[];
    outputs?: string[];
    name?: string;
    handler?: string;
    location?: string;
}
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
    extractedAt?: string;
    stackDetected?: string[];
    missingPieces?: string[];
}
export interface Metadata {
    version: string;
    generatedAt: string;
    generatorVersion: string;
}
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
    goalsAndSuccessCriteria?: GoalsAndSuccessCriteria;
    mvpScope?: MvpScope;
    assumptions?: Assumptions;
    dependencies?: Dependencies;
    roleDefinition?: RoleDefinition;
    productRequirements?: ProductRequirement[];
    criticalUserFlows?: CriticalUserFlow[];
    technicalRequirements?: TechnicalRequirement[];
    nonFunctionalRequirements?: NonFunctionalRequirement[];
    riskManagement?: RiskManagement;
    openQuestions?: OpenQuestions;
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
export interface Assumptions {
    technical?: string[];
    operational?: string[];
    financial?: string[];
    legal?: string[];
}
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
export interface AccessMatrix {
    feature: string;
    superAdmin?: string;
    medicalProvider?: string;
    reception?: string;
    patient?: string;
    [key: string]: string | undefined;
}
export interface RoleDefinition {
    roles?: Array<{
        id: string;
        name: string;
        description: string;
    }>;
    accessMatrix?: AccessMatrix[];
}
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
export interface TechnicalRequirement {
    category: "infrastructure" | "architecture" | "dataManagement" | "integration";
    requirements: string[];
    details?: Record<string, string>;
}
export interface NonFunctionalRequirement {
    category: "performance" | "security" | "usability" | "reliability" | "scalability";
    requirements: string[];
    metrics?: Record<string, string>;
}
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
//# sourceMappingURL=schema.d.ts.map