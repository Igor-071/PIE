export interface ScannedRepository {
    pages: string[];
    screens: string[];
    apiFiles: string[];
    dataModelFiles: string[];
    allFiles: string[];
}
/**
 * Recursively scans a repository directory to discover relevant files
 * @param repoPath - Path to the repository root directory
 * @returns Promise resolving to a structure with arrays of file paths
 */
export declare function scanRepository(repoPath: string): Promise<ScannedRepository>;
//# sourceMappingURL=repoScanner.d.ts.map