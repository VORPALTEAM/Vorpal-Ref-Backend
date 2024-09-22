import TelegramBot from "node-telegram-bot-api";
import { cmd} from "./types";
import { sendMessageWithSave } from "../../telegram/handlers/utils";
import { getUserData } from "../../models/user";

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


export async function adminCmdPreprocess (bot: TelegramBot, msg: TelegramBot.Message): Promise<number | null> {
    const chat = msg?.from?.id;
    if (!chat) return null;
    const user = await getUserData(String(chat));
    const isAdmin = user?.role_id === 2;
    if (!isAdmin) {
      sendMessageWithSave(
        bot,
        chat,
        `Function allowed for admins only`,
      );
      return null;
    }
    return chat;
}