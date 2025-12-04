import { PrdJson, QuestionsForClient } from "../models/schema.js";
export interface PrdArtifactsOptions {
    outputDir: string;
    projectName: string;
    templatePath?: string;
}
/**
 * Writes PRD artifacts to the output directory:
 * - PRD markdown file
 * - Structured JSON file
 * - Questions for client JSON file
 * @param prd - The complete PRD JSON data
 * @param questions - Questions for the client
 * @param options - Output options including directory, project name, and template path
 * @returns Promise resolving to an object with the markdown filename
 */
export declare function writePrdArtifacts(prd: PrdJson, questions: QuestionsForClient, options: PrdArtifactsOptions): Promise<{
    markdownFilename: string;
}>;
//# sourceMappingURL=prdGenerator.d.ts.map