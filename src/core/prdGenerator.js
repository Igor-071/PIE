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
exports.writePrdArtifacts = writePrdArtifacts;
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
/**
 * Writes PRD artifacts (JSON files and Markdown PRD) to the output directory
 * @param prd - Complete PRD JSON structure
 * @param questions - Questions for client
 * @param options - Options including output directory and project name
 */
function writePrdArtifacts(prd, questions, options) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1, prdJsonPath, error_2, questionsPath, error_3, sanitizedProjectName, markdownPath, markdownContent, templatePath, templateContent, projectName, error_4, projectName, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fs_1.promises.mkdir(options.outputDir, { recursive: true })];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    throw new Error("Failed to create output directory: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                case 3:
                    prdJsonPath = path_1.default.join(options.outputDir, "prd-structured.json");
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fs_1.promises.writeFile(prdJsonPath, JSON.stringify(prd, null, 2), "utf-8")];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _c.sent();
                    throw new Error("Failed to write PRD JSON: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                case 7:
                    questionsPath = path_1.default.join(options.outputDir, "questions-for-client.json");
                    _c.label = 8;
                case 8:
                    _c.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, fs_1.promises.writeFile(questionsPath, JSON.stringify(questions, null, 2), "utf-8")];
                case 9:
                    _c.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_3 = _c.sent();
                    throw new Error("Failed to write questions JSON: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                case 11:
                    sanitizedProjectName = options.projectName
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                    markdownPath = path_1.default.join(options.outputDir, "PRD_".concat(sanitizedProjectName, ".md"));
                    templatePath = options.templatePath ||
                        path_1.default.resolve(process.cwd(), "templates", "PRD_Template.md");
                    _c.label = 12;
                case 12:
                    _c.trys.push([12, 14, , 15]);
                    return [4 /*yield*/, fs_1.promises.readFile(templatePath, "utf-8")];
                case 13:
                    templateContent = _c.sent();
                    projectName = ((_a = prd.tier1) === null || _a === void 0 ? void 0 : _a.projectName) || options.projectName;
                    markdownContent = templateContent.replace(/\{\{projectName\}\}/g, projectName);
                    // Append JSON snapshot section
                    markdownContent += "\n\n## JSON Snapshot\n\n```json\n".concat(JSON.stringify(prd, null, 2), "\n```\n");
                    return [3 /*break*/, 15];
                case 14:
                    error_4 = _c.sent();
                    projectName = ((_b = prd.tier1) === null || _b === void 0 ? void 0 : _b.projectName) || options.projectName;
                    markdownContent = "# Product Requirements Document: ".concat(projectName, "\n\n");
                    markdownContent += "*Generated by Product Intelligence Engine*\n\n";
                    markdownContent += "## Overview\n\n";
                    markdownContent += "This PRD was automatically generated from repository code analysis.\n\n";
                    markdownContent += "## JSON Snapshot\n\n";
                    markdownContent += "```json\n".concat(JSON.stringify(prd, null, 2), "\n```\n");
                    return [3 /*break*/, 15];
                case 15:
                    _c.trys.push([15, 17, , 18]);
                    return [4 /*yield*/, fs_1.promises.writeFile(markdownPath, markdownContent, "utf-8")];
                case 16:
                    _c.sent();
                    return [3 /*break*/, 18];
                case 17:
                    error_5 = _c.sent();
                    throw new Error("Failed to write PRD Markdown: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                case 18: return [2 /*return*/];
            }
        });
    });
}
