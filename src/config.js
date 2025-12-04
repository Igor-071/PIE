"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
var dotenv_1 = require("dotenv");
// Load environment variables from .env file
dotenv_1.default.config();
function getConfig() {
    var openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
        throw new Error("OPENAI_API_KEY is required. Please set it in your environment variables or .env file.");
    }
    return {
        openAiApiKey: openAiApiKey,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
}
