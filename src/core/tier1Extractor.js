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
exports.extractTier1 = extractTier1;
var path_1 = require("path");
var repoScanner_js_1 = require("./repoScanner.js");
/**
 * Extracts Tier 1 technical data from a repository
 * @param repoPath - Path to the unzipped repository directory
 * @returns Promise resolving to Tier1Data
 */
function extractTier1(repoPath) {
    return __awaiter(this, void 0, void 0, function () {
        var scanned, projectName, screens, apiEndpoints, dataModels, stackDetected, aiMetadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, repoScanner_js_1.scanRepository)(repoPath)];
                case 1:
                    scanned = _a.sent();
                    projectName = path_1.default.basename(repoPath).replace(/^repo-/, "");
                    screens = scanned.screens.map(function (filePath) {
                        var name = path_1.default.basename(filePath, path_1.default.extname(filePath));
                        // Detect framework from file path or extension
                        var framework;
                        if (filePath.includes("/app/") || filePath.includes("/pages/api/")) {
                            framework = "nextjs";
                        }
                        else if (filePath.includes("/src/pages/")) {
                            framework = "react";
                        }
                        else if (filePath.includes("/screens/")) {
                            framework = "react-native";
                        }
                        return {
                            name: name,
                            path: filePath,
                            framework: framework,
                        };
                    });
                    apiEndpoints = scanned.apiFiles.map(function (filePath) {
                        var segments = filePath.split("/");
                        var fileName = path_1.default.basename(filePath, path_1.default.extname(filePath));
                        // Try to infer method and path from file structure
                        var method = "GET";
                        var endpointPath = "/api";
                        if (filePath.includes("/api/")) {
                            var apiIndex = segments.indexOf("api");
                            if (apiIndex >= 0 && apiIndex < segments.length - 1) {
                                endpointPath = "/" + segments.slice(apiIndex + 1, -1).join("/");
                            }
                        }
                        // Check for method in filename (e.g., route.get.ts, api.post.js)
                        var methodMatch = fileName.match(/\.(get|post|put|delete|patch)\./i);
                        if (methodMatch) {
                            method = methodMatch[1].toUpperCase();
                        }
                        var framework;
                        if (filePath.includes("/pages/api/") || filePath.includes("/app/api/")) {
                            framework = "nextjs";
                        }
                        else if (filePath.includes("/routes/")) {
                            framework = "express";
                        }
                        return {
                            method: method,
                            path: endpointPath,
                            handler: filePath,
                            framework: framework,
                        };
                    });
                    dataModels = scanned.dataModelFiles.map(function (filePath) {
                        var fileName = path_1.default.basename(filePath);
                        var type = "unknown";
                        if (fileName === "schema.prisma") {
                            type = "prisma";
                        }
                        else if (filePath.includes("/models/")) {
                            type = "mongoose";
                        }
                        else if (filePath.includes("/schema/")) {
                            type = "typeorm";
                        }
                        return {
                            name: path_1.default.basename(filePath, path_1.default.extname(filePath)),
                            type: type,
                            location: filePath,
                        };
                    });
                    stackDetected = [];
                    if (scanned.allFiles.some(function (f) { return f.includes("/pages/") || f.includes("/app/"); })) {
                        stackDetected.push("nextjs");
                    }
                    if (scanned.allFiles.some(function (f) { return f.includes("package.json"); })) {
                        stackDetected.push("nodejs");
                    }
                    if (scanned.allFiles.some(function (f) { return f.endsWith(".tsx") || f.endsWith(".jsx"); })) {
                        stackDetected.push("react");
                    }
                    if (scanned.dataModelFiles.some(function (f) { return f.includes("schema.prisma"); })) {
                        stackDetected.push("prisma");
                    }
                    aiMetadata = {
                        extractedAt: new Date().toISOString(),
                        stackDetected: stackDetected,
                        missingPieces: [],
                        extractionNotes: [
                            "Scanned ".concat(scanned.allFiles.length, " files"),
                            "Found ".concat(screens.length, " screens/pages"),
                            "Found ".concat(apiEndpoints.length, " API endpoints"),
                            "Found ".concat(dataModels.length, " data model files"),
                        ],
                        tier1Confidence: scanned.allFiles.length > 0 ? "medium" : "low",
                    };
                    return [2 /*return*/, {
                            projectName: projectName,
                            screens: screens,
                            navigation: [], // Will be populated in later phases
                            apiEndpoints: apiEndpoints,
                            dataModels: dataModels,
                            statePatterns: [], // Will be populated in later phases
                            events: [], // Will be populated in later phases
                            aiMetadata: aiMetadata,
                        }];
            }
        });
    });
}
