import TelegramBot from "node-telegram-bot-api";
import { addAnnounceChatAction, manageMembersAction } from "../commands";

export const callbackHandler = async (query: TelegramBot.CallbackQuery) => {
    if (!query.data) return;
    switch (true) {
        case query.data.indexOf("addAnnounce_") > -1:
          addAnnounceChatAction(query)
          break;
        case query.data.indexOf("members_") > -1:
          manageMembersAction(query)
          break;
        }
}