import TelegramBot from 'node-telegram-bot-api';
import { publisherBot } from '../initial';
import { adminCmdPreprocess } from '../functions';
import { getAdminSession } from '../session';
import { sendMessageWithSave } from '../../handlers/utils';
import {
  addTournamentAdmin,
  createDuelInTournament,
  createTournament,
  getActiveTournaments,
  getParticipantsData,
  getParticipantsIds,
  getTournamentAdmins,
  getTournamentAnnounceChats,
  getTournamentDuels,
  updateTournamentTime,
} from '../../../models/tournament';
import { dateSec, dateSecFormat, formatTime } from '../../../utils/text';
import {
  getUserById,
  getUserData,
  getUserTelegramChat,
} from '../../../models/user';
import { Bot } from '../../bot';
import { basicStartappLink } from '../../constants';
import { getUserInviterByTelegramId } from 'models/telegram/referral';
import { getDuelUsers } from '../../../models/telegram';

export const prolongAction = async (query: TelegramBot.CallbackQuery) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, query);
    if (!chat) return;
    if (!query.data) return;
    const session = getAdminSession(chat);
    const tourId = Number(query.data.replace('prolong_', ''));   
    if (isNaN(tourId))  {
        sendMessageWithSave(publisherBot, chat, "Invalid tour id");
        return;
    }
    session.setLastAction("prolong_tournament");
    session.tournamentId = tourId;
    sendMessageWithSave(publisherBot, chat, `
        Enter new duel finish time, \n
        format: YYYY-MM-DDTHH:MM:SSZ \n
        write now to terminate, cancel to cancel command
        `); 
}

export const prolongTournament = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    if (!msg.text) return;
    const session = getAdminSession(chat);
    let date: number = 0;
    switch (true) {
        case msg.text === "cancel":
            session.setLastAction("none");
            sendMessageWithSave(publisherBot, chat, "Time updating cancelled");
            break;
        case msg.text === "now":
            date = dateSec();
            break;
        default:
            date = Math.round(new Date(msg.text).getTime() / 1000);
            return;
    }
    if (!date || isNaN(date) || !session.tournamentId) {
        sendMessageWithSave(publisherBot, chat, "Invalid entry");
        return;
    }
    const result = await updateTournamentTime(session.tournamentId, date);
    session.setLastAction("none")
    sendMessageWithSave(publisherBot, chat, "Tournament time updated");
    return;
}
