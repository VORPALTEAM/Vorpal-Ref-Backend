import { getActiveTournament, getParticipantsIds, takePartInTournament } from "../../models/tournament";
import TelegramBot from "node-telegram-bot-api";
import { sendMessageWithSave } from "./utils";
import { createUserIfNotExists, getUserId } from "models/user";


export const tournamentTakePartHandler = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chat = msg.from?.id;
    if (!chat) return;
    const active = await getActiveTournament();
    if (!active) {
        sendMessageWithSave(bot, chat, "No active tournaments");
        return;
    }
    const userId = await createUserIfNotExists("user", undefined, undefined, msg.from);
    const participants = await getParticipantsIds ();
    if (participants.indexOf(String(chat)) > -1) {
        sendMessageWithSave(bot, chat, "You already in tournament");
        return;
    }
    await takePartInTournament(userId, active.id);
    sendMessageWithSave(bot, chat, "Welcome to a tournament. Wait for duel creation");
}