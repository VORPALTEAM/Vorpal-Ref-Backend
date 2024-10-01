import TelegramBot from "node-telegram-bot-api";
import { addAnnounceChatAction } from "../commands";

export const callbackHandler = async (query: TelegramBot.CallbackQuery) => {
    if (!query.data) return;
    switch (true) {
        case query.data.indexOf("addAnnounce_") > -1:
          addAnnounceChatAction(query)
          break;
        }
}