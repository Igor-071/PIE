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
exports.collectEvidence = collectEvidence;
var fs_1 = require("fs");
var path_1 = require("path");
/**
 * Collects textual evidence from the repository (README, docs, optional brief)
 * @param repoPath - Path to the repository root directory
 * @param options - Options including optional brief text
 * @returns Promise resolving to an array of EvidenceDocument
 */
function collectEvidence(repoPath_1) {
    return __awaiter(this, arguments, void 0, function (repoPath, options) {
        var documents, readmeNames, _i, readmeNames_1, readmeName, readmePath, content, _a, docsPath, entries, _b, entries_1, entry, fileName, filePath, content, _c, _d;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    documents = [];
                    readmeNames = ["README.md", "README.txt", "readme.md", "readme.txt"];
                    _i = 0, readmeNames_1 = readmeNames;
                    _e.label = 1;
                case 1:
                    if (!(_i < readmeNames_1.length)) return [3 /*break*/, 6];
                    readmeName = readmeNames_1[_i];
                    readmePath = path_1.default.join(repoPath, readmeName);
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fs_1.promises.readFile(readmePath, "utf-8")];
                case 3:
                    content = _e.sent();
                    documents.push({
                        id: "readme-".concat(readmeName),
                        type: "repo_readme",
                        title: "Repository README (".concat(readmeName, ")"),
                        content: content,
                        path: readmePath,
                    });
                    // Only take the first README found
                    return [3 /*break*/, 6];
                case 4:
                    _a = _e.sent();
                    // File doesn't exist, continue
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    docsPath = path_1.default.join(repoPath, "docs");
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 15, , 16]);
                    return [4 /*yield*/, fs_1.promises.readdir(docsPath, { withFileTypes: true })];
                case 8:
                    entries = _e.sent();
                    _b = 0, entries_1 = entries;
                    _e.label = 9;
                case 9:
                    if (!(_b < entries_1.length)) return [3 /*break*/, 14];
                    entry = entries_1[_b];
                    if (!entry.isFile()) return [3 /*break*/, 13];
                    fileName = entry.name.toLowerCase();
                    if (!(fileName.endsWith(".md") || fileName.endsWith(".txt"))) return [3 /*break*/, 13];
                    filePath = path_1.default.join(docsPath, entry.name);
                    _e.label = 10;
                case 10:
                    _e.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, fs_1.promises.readFile(filePath, "utf-8")];
                case 11:
                    content = _e.sent();
                    documents.push({
                        id: "doc-".concat(entry.name),
                        type: "repo_docs",
                        title: "Documentation: ".concat(entry.name),
                        content: content,
                        path: filePath,
                    });
                    return [3 /*break*/, 13];
                case 12:
                    _c = _e.sent();
                    // Skip files that can't be read as text
                    return [3 /*break*/, 13];
                case 13:
                    _b++;
                    return [3 /*break*/, 9];
                case 14: return [3 /*break*/, 16];
                case 15:
                    _d = _e.sent();
                    return [3 /*break*/, 16];
                case 16:
                    // Add uploaded brief if provided
                    if (options.briefText && options.briefText.trim().length > 0) {
                        documents.push({
                            id: "brief",
                            type: "uploaded_brief",
                            title: "Uploaded brief",
                            content: options.briefText.trim(),
                        });
                    }
                    return [2 /*return*/, documents];
            }
        });
    });
}
