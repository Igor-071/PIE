import { Navigation } from "../models/schema.js";
/**
 * Extracts navigation structure from repository
 * @param repoPath - Path to the repository root directory
 * @param screens - List of discovered screens
 * @returns Promise resolving to array of navigation items
 */
export declare function extractNavigation(repoPath: string, screens: string[]): Promise<Navigation[]>;
//# sourceMappingURL=navigationExtractor.d.ts.map