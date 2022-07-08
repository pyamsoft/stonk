// Parse the .env file if one exists
import DotEnv from "dotenv";
import { newLogger } from "./bot/logger";

DotEnv.config();

const logger = newLogger("BotConfig");

export interface BotConfig {
  prefix: string;
  token: string;
  specificChannel: string;
}

export const sourceConfig = function (): BotConfig {
  const config = Object.freeze({
    prefix: process.env.BOT_PREFIX || "$",
    token: process.env.BOT_TOKEN || "",
    specificChannel: process.env.BOT_CHANNEL_ID || "",
  });
  logger.log("Bot Config: ", config);
  return config;
};
