"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGeneratePrdCommand = registerGeneratePrdCommand;
var path_1 = require("path");
var fs_1 = require("fs");
var unzipRepo_js_1 = require("../../core/unzipRepo.js");
var tier1Extractor_js_1 = require("../../core/tier1Extractor.js");
var evidenceCollector_js_1 = require("../../core/evidenceCollector.js");
var jsonMerger_js_1 = require("../../core/jsonMerger.js");
var tier2Agent_js_1 = require("../../core/tier2Agent.js");
var prdGenerator_js_1 = require("../../core/prdGenerator.js");
/**
 * Registers the generate-prd command with the Commander program
 * @param program - Commander program instance
 */
function registerGeneratePrdCommand(program) {
    var _this = this;
    program
        .command("generate-prd")
        .description("Generate a PRD from a ZIP repository")
        .argument("<repoZip>", "Path to the ZIP repository file")
        .option("-b, --brief <file>", "Path to optional brief text file")
        .option("-o, --output <dir>", "Output directory", "./out")
        .option("--max-questions <number>", "Maximum number of questions to generate", "7")
        .action(function (repoZip, options) { return __awaiter(_this, void 0, void 0, function () {
        var zipPath, outputDir, maxQuestions, briefText, briefPath, error_1, unzippedPath, tier1, evidence, baseJson, result, sanitizedProjectName, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    zipPath = path_1.default.resolve(repoZip);
                    outputDir = path_1.default.resolve(options.output || "./out");
                    maxQuestions = parseInt(options.maxQuestions || "7", 10);
                    briefText = null;
                    if (!options.brief) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    briefPath = path_1.default.resolve(options.brief);
                    return [4 /*yield*/, fs_1.promises.readFile(briefPath, "utf-8")];
                case 2:
                    briefText = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Warning: Could not read brief file: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    briefText = null;
                    return [3 /*break*/, 4];
                case 4:
                    // Step 1: Unzip repository
                    console.log("Unzipping repository...");
                    return [4 /*yield*/, (0, unzipRepo_js_1.unzipRepository)(zipPath)];
                case 5:
                    unzippedPath = _a.sent();
                    console.log("Repository extracted to: ".concat(unzippedPath));
                    // Step 2: Extract Tier 1 data
                    console.log("Detecting stack...");
                    console.log("Tier 1 extraction complete.");
                    return [4 /*yield*/, (0, tier1Extractor_js_1.extractTier1)(unzippedPath)];
                case 6:
                    tier1 = _a.sent();
                    // Step 3: Collect evidence
                    console.log("Collecting evidence...");
                    return [4 /*yield*/, (0, evidenceCollector_js_1.collectEvidence)(unzippedPath, { briefText: briefText })];
                case 7:
                    evidence = _a.sent();
                    baseJson = (0, jsonMerger_js_1.buildInitialPrdJsonFromTier1)(tier1);
                    // Step 5: Run Tier 2 agent
                    console.log("Running Tier 2 agent...");
                    return [4 /*yield*/, (0, tier2Agent_js_1.runTier2Agent)(baseJson, evidence, {
                            maxQuestions: maxQuestions,
                        })];
                case 8:
                    result = _a.sent();
                    console.log("Tier 2 agent complete.");
                    // Step 6: Write artifacts
                    console.log("Generating PRD...");
                    return [4 /*yield*/, (0, prdGenerator_js_1.writePrdArtifacts)(result.updatedJson, result.questionsForClient, {
                            outputDir: outputDir,
                            projectName: tier1.projectName,
                        })];
                case 9:
                    _a.sent();
                    sanitizedProjectName = tier1.projectName
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                    console.log("PRD written to: ".concat(path_1.default.join(outputDir, "PRD_".concat(sanitizedProjectName, ".md"))));
                    console.log("Structured JSON written to: ".concat(path_1.default.join(outputDir, "prd-structured.json")));
                    console.log("Questions written to: ".concat(path_1.default.join(outputDir, "questions-for-client.json")));
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _a.sent();
                    console.error("Error generating PRD:", error_2 instanceof Error ? error_2.message : String(error_2));
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    }); });
}
