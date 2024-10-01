import {
  getLastTournament,
  getParticipantsIds,
  isTournamentActive,
  isTournamentRegistrationAvailable,
  takePartInTournament,
} from '../../models/tournament';
import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from './utils';
import { createUserIfNotExists, getUserId } from '../../models/user';

export const getTournamentsHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message,
) => {};

export const tournamentTakePartHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message | TelegramBot.CallbackQuery,
  tourId?: number,
) => {
  const chat = msg.from?.id;
  if (!chat) return;
  const tournamentId = tourId || (await getLastTournament())?.id;
  if (!tournamentId) {
    sendMessageWithSave(bot, chat, 'Tournment is not found');
    return;
  }
  const available = await isTournamentRegistrationAvailable(tournamentId);
  if (!available) {
    sendMessageWithSave(bot, chat, 'Tournment is not available');
    return;
  }
  const userId = await createUserIfNotExists(
    'user',
    undefined,
    undefined,
    msg.from,
  );
  const participants = await getParticipantsIds(tournamentId);
  if (participants.indexOf(String(chat)) > -1) {
    sendMessageWithSave(bot, chat, 'You already in this tournament');
    return;
  }
  await takePartInTournament(userId, tournamentId);
  sendMessageWithSave(
    bot,
    chat,
    'Welcome to a tournament. Wait for duel creation',
  );
};
