import {
  createDuelInTournament,
  getLastTournament,
  getParticipantsIds,
  isTournamentActive,
} from '../../models/tournament';
import { isUserInDuel } from '../../models/telegram';
import { getUserId } from '../../models/user';
import { sendMessageWithSave } from '../handlers/utils';
import TelegramBot from 'node-telegram-bot-api';
import { InlineKeyboard } from '../handlers/keyboard';

export async function createDuelInTournamentAction(
  bot: TelegramBot,
  user1: string,
  user2: string,
  tourId?: number,
) {
  const user1Id = await getUserId(user1);
  const user2Id = await getUserId(user2);
  const tournamentId = tourId || (await getLastTournament())?.id;

  if (!tournamentId) {
    return {
      success: false,
      error: 'Tournament not found',
    };
  }

  const isActive = await isTournamentActive(tournamentId);

  if (!isActive) {
    return {
      success: false,
      error: 'Tournament is not active',
    };
  }

  if (!user1Id || !user2Id) {
    return {
      success: false,
      error: 'One of users not found',
    };
  }

  const isInDuel = await Promise.all([
    isUserInDuel(user1Id),
    isUserInDuel(user2Id),
  ]);
  if (isInDuel[0] || isInDuel[1]) {
    return {
      success: false,
      error: 'One of players is already in duel',
    };
  }

  const participants = await getParticipantsIds(tournamentId);

  if (participants.length === 0) {
    return {
      success: false,
      error: 'No active tournament or no any participants',
    };
  }

  if (
    participants.indexOf(user1) === -1 ||
    participants.indexOf(user2) === -1
  ) {
    return {
      success: false,
      error: 'One of players not in a tournament',
    };
  }

  const result = await createDuelInTournament(user1Id, user2Id, tournamentId);
  if (result.success && !isNaN(Number(user1)) && !isNaN(Number(user1))) {
    sendMessageWithSave(bot, Number(user1), 'Your tournament duel started', {
      reply_markup: InlineKeyboard(['enterGame']),
    });
    sendMessageWithSave(bot, Number(user2), 'Your tournament duel started', {
      reply_markup: InlineKeyboard(['enterGame']),
    });
  }
  return {
    success: result.success,
    error: result.error,
    duelId: result.duelId,
  };
}
