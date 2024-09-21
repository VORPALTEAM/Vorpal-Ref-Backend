import TelegramBot from "node-telegram-bot-api";
import { cmd} from "./types";

export function setupBotMenu (bot: TelegramBot, commands: cmd[]) {
    try {
        bot.setMyCommands(commands.map((item) => {
            return {
                command: item.name,
                description: item.description
            }
        }));
        // console.log("Result: ", cmd)
    } catch (e: any) {
        console.log("Error: ", e.message)
    }
    
}