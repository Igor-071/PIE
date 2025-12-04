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
exports.runTier2Agent = runTier2Agent;
var openai_1 = require("openai");
var config_js_1 = require("../config.js");
/**
 * Runs the Tier 2 AI agent to fill strategic fields in the PRD JSON
 * @param baseJson - Initial PRD JSON with Tier 1 data populated
 * @param evidence - Evidence documents collected from the repository
 * @param options - Options including maxQuestions and model
 * @returns Promise resolving to Tier2Result with updated JSON and questions
 */
function runTier2Agent(baseJson_1, evidence_1) {
    return __awaiter(this, arguments, void 0, function (baseJson, evidence, options) {
        var config, openai, maxQuestions, model, systemPrompt, evidenceSummary, userMessage, completion, responseContent, parsedResponse, error_1;
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    config = (0, config_js_1.getConfig)();
                    openai = new openai_1.default({
                        apiKey: config.openAiApiKey,
                    });
                    maxQuestions = (_a = options.maxQuestions) !== null && _a !== void 0 ? _a : 7;
                    model = (_b = options.model) !== null && _b !== void 0 ? _b : config.model;
                    systemPrompt = "You are a Product Intelligence Engine agent responsible for filling Tier 2 strategic fields in a Product Requirements Document (PRD).\n\nYour task:\n1. Analyze the provided PRD JSON (which contains Tier 1 technical data extracted from code)\n2. Use the evidence documents (README, docs, brief) to fill Tier 2 strategic fields\n3. Wrap ALL strategic field values in StrategicText objects with:\n   - value: the actual text (or null if unknown)\n   - confidence: \"high\" | \"medium\" | \"low\" | \"unknown\"\n   - sourceType: one of \"uploaded_brief\" | \"repo_readme\" | \"repo_docs\" | \"model_inference\" | \"other\"\n   - sources: optional array of source identifiers\n   - notes: optional notes about the extraction\n\n4. Generate client questions for missing or low-confidence fields (max ".concat(maxQuestions, " questions)\n\nRules:\n- Use evidence documents when available (high confidence)\n- Infer from code structure when evidence is missing (low confidence)\n- If completely unknown, set value to null and confidence to \"unknown\"\n- Never modify Tier 1 fields\n- Return valid JSON matching the PrdJson structure\n\nReturn a JSON object with this structure:\n{\n  \"updatedJson\": { ...PrdJson... },\n  \"questionsForClient\": {\n    \"questions\": [ ...ClientQuestion[]... ],\n    \"generatedAt\": \"ISO timestamp\"\n  }\n}");
                    evidenceSummary = evidence.map(function (doc) { return ({
                        id: doc.id,
                        type: doc.type,
                        title: doc.title,
                        contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? "..." : ""),
                    }); });
                    userMessage = "Please analyze this PRD and fill Tier 2 strategic fields.\n\nCurrent PRD JSON:\n".concat(JSON.stringify(baseJson, null, 2), "\n\nEvidence Documents (").concat(evidence.length, "):\n").concat(JSON.stringify(evidenceSummary, null, 2), "\n\nFull evidence content:\n").concat(evidence.map(function (doc) { return "\n--- ".concat(doc.title, " (").concat(doc.type, ") ---\n").concat(doc.content); }).join("\n\n"), "\n\nGenerate up to ").concat(maxQuestions, " follow-up questions for missing or low-confidence areas.");
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: model,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userMessage },
                            ],
                            response_format: { type: "json_object" },
                            temperature: 0.7,
                        })];
                case 2:
                    completion = _e.sent();
                    responseContent = (_d = (_c = completion.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
                    if (!responseContent) {
                        throw new Error("Empty response from OpenAI API");
                    }
                    parsedResponse = void 0;
                    try {
                        parsedResponse = JSON.parse(responseContent);
                    }
                    catch (parseError) {
                        throw new Error("Failed to parse JSON response from OpenAI: ".concat(parseError instanceof Error ? parseError.message : String(parseError)));
                    }
                    // Validate response structure
                    if (!parsedResponse.updatedJson) {
                        throw new Error("Response missing 'updatedJson' field");
                    }
                    if (!parsedResponse.questionsForClient) {
                        throw new Error("Response missing 'questionsForClient' field");
                    }
                    // Ensure questionsForClient has generatedAt if missing
                    if (!parsedResponse.questionsForClient.generatedAt) {
                        parsedResponse.questionsForClient.generatedAt = new Date().toISOString();
                    }
                    return [2 /*return*/, {
                            updatedJson: parsedResponse.updatedJson,
                            questionsForClient: parsedResponse.questionsForClient,
                        }];
                case 3:
                    error_1 = _e.sent();
                    if (error_1 instanceof Error) {
                        throw new Error("Tier 2 agent failed: ".concat(error_1.message));
                    }
                    throw new Error("Tier 2 agent failed: ".concat(String(error_1)));
                case 4: return [2 /*return*/];
            }
        });
    });
}
