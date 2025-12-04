export interface ParsedFile {
    content: string;
    fileName: string;
    fileType: string;
}
/**
 * Parses various file types and extracts text content
 * @param filePath - Path to the file to parse
 * @returns Promise resolving to parsed file content
 */
export declare function parseFile(filePath: string): Promise<ParsedFile>;
//# sourceMappingURL=fileParser.d.ts.map