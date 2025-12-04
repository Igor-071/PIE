import path from "path";
import { promises as fs } from "fs";
import { unzipRepository } from "../../core/unzipRepo.js";
import { extractTier1 } from "../../core/tier1Extractor.js";
import { collectEvidence } from "../../core/evidenceCollector.js";
import { buildInitialPrdJsonFromTier1 } from "../../core/jsonMerger.js";
import { runTier2Agent } from "../../core/tier2Agent.js";
import { runTier3Agent } from "../../core/tier3Agent.js";
import { writePrdArtifacts } from "../../core/prdGenerator.js";
import { cleanupDirectory } from "../../core/cleanup.js";
/**
 * Registers the generate-prd command with the Commander program
 * @param program - Commander program instance
 */
export function registerGeneratePrdCommand(program) {
    program
        .command("generate-prd")
        .description("Generate a PRD from a ZIP repository")
        .argument("<repoZip>", "Path to the ZIP repository file")
        .option("-b, --brief <file>", "Path to optional brief text file")
        .option("-o, --output <dir>", "Output directory", "./out")
        .option("--max-questions <number>", "Maximum number of questions to generate", "7")
        .action(async (repoZip, options) => {
        try {
            // Resolve paths
            const zipPath = path.resolve(repoZip);
            const outputDir = path.resolve(options.output || "./out");
            const maxQuestions = parseInt(options.maxQuestions || "7", 10);
            // Read brief file if provided
            let briefText = null;
            if (options.brief) {
                try {
                    const briefPath = path.resolve(options.brief);
                    briefText = await fs.readFile(briefPath, "utf-8");
                }
                catch (error) {
                    console.error(`Warning: Could not read brief file: ${error instanceof Error ? error.message : String(error)}`);
                    briefText = null;
                }
            }
            // Step 1: Unzip repository
            console.log("Unzipping repository...");
            const unzippedPath = await unzipRepository(zipPath);
            console.log(`Repository extracted to: ${unzippedPath}`);
            try {
                // Step 2: Extract Tier 1 data
                console.log("Extracting Tier 1 technical data...");
                const tier1 = await extractTier1(unzippedPath);
                console.log("Tier 1 extraction complete.");
                // Step 3: Collect evidence (pass tier1 for enhanced collection)
                console.log("Collecting evidence...");
                const evidence = await collectEvidence(unzippedPath, { briefText }, tier1);
                // Step 4: Build initial PRD JSON
                const baseJson = buildInitialPrdJsonFromTier1(tier1);
                // Step 5: Run Tier 2 agent (strategic sections)
                console.log("Running Tier 2 agent (strategic sections)...");
                const tier2Result = await runTier2Agent(baseJson, evidence, {
                    maxQuestions,
                });
                console.log("Tier 2 agent complete.");
                // Step 6: Run Tier 3 agent (detailed sections)
                console.log("Running Tier 3 agent (detailed sections)...");
                const tier3Result = await runTier3Agent(tier2Result.updatedJson, evidence, tier1);
                console.log("Tier 3 agent complete.");
                // Step 7: Merge questions from Tier 2 and Tier 3
                const allQuestions = {
                    questions: [
                        ...tier2Result.questionsForClient.questions,
                        ...tier3Result.questions.questions,
                    ],
                    generatedAt: new Date().toISOString(),
                };
                // Step 8: Write artifacts
                console.log("Generating PRD...");
                await writePrdArtifacts(tier3Result.updatedJson, allQuestions, {
                    outputDir,
                    projectName: tier1.projectName,
                });
                const sanitizedProjectName = tier1.projectName
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                console.log(`PRD written to: ${path.join(outputDir, `PRD_${sanitizedProjectName}.md`)}`);
                console.log(`Structured JSON written to: ${path.join(outputDir, "prd-structured.json")}`);
                console.log(`Questions written to: ${path.join(outputDir, "questions-for-client.json")}`);
            }
            finally {
                // Clean up temporary directory
                console.log("Cleaning up temporary files...");
                await cleanupDirectory(unzippedPath, true);
            }
        }
        catch (error) {
            console.error("Error generating PRD:", error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
//# sourceMappingURL=generatePrd.js.map