import { BotConfig } from "../config";
import { MessageHandler } from "./message/handler/MessageHandler";
import { Listener } from "../model/listener";
export interface DiscordBot {
    login: () => Promise<boolean>;
    addHandler: (handler: MessageHandler) => string;
    removeHandler: (id: string) => boolean;
    watchMessages: () => Listener;
}
export declare const initializeBot: (config: BotConfig) => DiscordBot;
