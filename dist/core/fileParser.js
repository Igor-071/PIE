import { promises as fs } from "fs";
import * as path from "path";
import mammoth from "mammoth";
// Dynamic import for pdf-parse due to CommonJS/ESM compatibility issues
let pdfParse;
async function getPdfParse() {
    if (!pdfParse) {
        const pdfParseModule = await import("pdf-parse");
        pdfParse = pdfParseModule.default || pdfParseModule;
    }
    return pdfParse;
}
/**
 * Parses various file types and extracts text content
 * @param filePath - Path to the file to parse
 * @returns Promise resolving to parsed file content
 */
export async function parseFile(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const buffer = await fs.readFile(filePath);
    switch (ext) {
        case ".pdf":
            return await parsePdf(buffer, fileName);
        case ".docx":
            return await parseDocx(buffer, fileName);
        case ".doc":
            // For older .doc files, we'll try to read as text (limited support)
            // In production, you might want to use a library like textract
            return {
                content: `[Note: .doc file format detected. Content extraction may be limited. Please convert to .docx or .pdf for better results.]\n\n${buffer.toString("utf-8", 0, Math.min(10000, buffer.length))}`,
                fileName,
                fileType: "doc",
            };
        case ".txt":
        case ".md":
            return {
                content: buffer.toString("utf-8"),
                fileName,
                fileType: ext.substring(1),
            };
        default:
            // Try to read as text for unknown types
            try {
                return {
                    content: buffer.toString("utf-8"),
                    fileName,
                    fileType: ext.substring(1) || "unknown",
                };
            }
            catch {
                throw new Error(`Unsupported file type: ${ext}`);
            }
    }
}
async function parsePdf(buffer, fileName) {
    try {
        const pdfParseFn = await getPdfParse();
        const data = await pdfParseFn(buffer);
        return {
            content: data.text,
            fileName,
            fileType: "pdf",
        };
    }
    catch (error) {
        throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function parseDocx(buffer, fileName) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return {
            content: result.value,
            fileName,
            fileType: "docx",
        };
    }
    catch (error) {
        throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=fileParser.js.map