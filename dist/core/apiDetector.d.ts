import { ApiEndpoint } from "../models/schema.js";
/**
 * Enhanced API endpoint detection that finds both route files and API calls in code
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to array of API endpoints
 */
export declare function detectApiEndpoints(repoPath: string, allFiles: string[]): Promise<ApiEndpoint[]>;
//# sourceMappingURL=apiDetector.d.ts.map