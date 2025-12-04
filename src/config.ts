import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in project root
// Go up from dist/config.js to project root
dotenv.config({ path: resolve(__dirname, "../.env") });

export interface Config {
  openAiApiKey: string;
  model: string;
  tmpDir?: string;
}

/**
 * Validates OpenAI API key format
 */
function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("OPENAI_API_KEY must be a non-empty string");
  }

  // OpenAI API keys typically start with "sk-"
  if (!apiKey.startsWith("sk-")) {
    throw new Error(
      'OPENAI_API_KEY appears to be invalid. OpenAI API keys typically start with "sk-". ' +
      "Please check your .env file or environment variables."
    );
  }

  // Basic length check (OpenAI keys are usually 51+ characters)
  if (apiKey.length < 20) {
    throw new Error(
      "OPENAI_API_KEY appears to be too short. Please verify your API key is correct."
    );
  }
}

/**
 * Validates OpenAI model name
 */
function validateModel(model: string): void {
  const validModels = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
  ];

  // Allow any model name but warn if it's not in the known list
  if (!validModels.includes(model)) {
    console.warn(
      `Warning: Model "${model}" is not in the list of known models. ` +
      `Known models: ${validModels.join(", ")}`
    );
  }
}

export function getConfig(): Config {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. " +
      "Please set it in your environment variables or create a .env file in the project root with: OPENAI_API_KEY=your_api_key_here"
    );
  }

  // Validate API key format
  validateApiKey(openAiApiKey);

  const model = process.env.OPENAI_MODEL || "gpt-4-turbo";
  
  // Validate model name
  validateModel(model);

  const config: Config = {
    openAiApiKey,
    model,
  };

  // Optional: tmp directory override
  if (process.env.PIE_TMP_DIR) {
    config.tmpDir = process.env.PIE_TMP_DIR;
  }

  return config;
}
