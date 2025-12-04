export type EvidenceType = "repo_readme" | "repo_docs" | "uploaded_brief" | "package_metadata" | "code_summary";
export interface EvidenceDocument {
    id: string;
    type: EvidenceType;
    title: string;
    content: string;
    path?: string;
}
export interface EvidenceCollectorOptions {
    briefText?: string | null;
    briefFiles?: string[];
}
/**
 * Collects textual evidence from the repository (README, docs, optional brief)
 * @param repoPath - Path to the repository root directory
 * @param options - Options including optional brief text
 * @param tier1Data - Optional Tier 1 data for generating code summary
 * @returns Promise resolving to an array of EvidenceDocument
 */
export declare function collectEvidence(repoPath: string, options?: EvidenceCollectorOptions, tier1Data?: any): Promise<EvidenceDocument[]>;
//# sourceMappingURL=evidenceCollector.d.ts.map