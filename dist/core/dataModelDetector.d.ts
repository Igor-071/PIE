import { DataModel } from "../models/schema.js";
/**
 * Enhanced data model detection that finds interfaces, types, and schemas
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to data model object
 */
export declare function detectDataModels(repoPath: string, allFiles: string[]): Promise<DataModel>;
//# sourceMappingURL=dataModelDetector.d.ts.map