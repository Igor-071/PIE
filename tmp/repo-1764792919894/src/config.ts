import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export interface Config {
  openAiApiKey: string;
  model: string;
}

export function getConfig(): Config {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. Please set it in your environment variables or .env file."
    );
  }

  return {
    openAiApiKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}
