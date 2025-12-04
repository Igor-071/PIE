export interface StatePattern {
    type: string;
    stores?: string[];
    location?: string;
}
/**
 * Detects state management patterns and libraries in the codebase
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to array of state patterns
 */
export declare function detectStatePatterns(repoPath: string, allFiles: string[]): Promise<StatePattern[]>;
//# sourceMappingURL=statePatternDetector.d.ts.map