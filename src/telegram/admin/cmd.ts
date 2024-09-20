import {
    createDuelInTournament,
  createTournament,
  getActiveTournament,
  getParticipantsIds,
} from '../../models/tournament';
import { getUserData } from '../../models/user';
import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from '../handlers/utils';
import { createDuelInTournamentAction } from './tournament';
import { downloadReferralStats } from './referral';
import { getAdminSession } from './session';

export const adminCmdInfo = {
      help: "Get list of all commands",
      init_post: "Start to create post, next message will sent to all members",
      create_tournament: "New tournament",
      referral_stats: "Get bot statistics in csv file",
      create_duel: "Create duel in tournament, nex 2 args will be a members' ids",
      get_participants: "Get list of last tournament participants"
}

export const admin_commands = [
  'create_duel',
  'create_tournament',
  'get_participants',
  'referral_stats',
  'init_post',
  'help'
];

export const adminCmdHandler = async (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  cmd: string,
) => {
  const cmdData = cmd.split(' ');
  const chat = msg.from?.id;
  if (!chat) return;
  if (cmdData.length < 2) {
    sendMessageWithSave(
      bot,
      chat,
      `No cmd specified, available commands: 
            ${admin_commands.join(', ')}`,
    );
    return;
  }
  const command = cmdData[1];
  const userId = await getUserData(String(chat));
  const active = await getActiveTournament();
  if (!userId || userId.role_id !== 2) {
    sendMessageWithSave(bot, chat, `No rights to send admin commands`);
    return;
  }
  const session = getAdminSession(String(chat));
  if (session.getLastAction() === admin_commands[4]) {
    sendMessageWithSave(bot, chat, `Will send it: ${cmd}`);
    return;
  }
  session.setLastAction(command);
  switch (command) {
    case admin_commands[0]:
      if (cmdData.length < 4) {
        sendMessageWithSave(bot, chat, `Write at least 2 players`);
        return;
      }
      const duel = await createDuelInTournamentAction (bot, cmdData[2], cmdData[3]);
      if (duel.error) {
        sendMessageWithSave(bot, chat, `Failed to create a duel: ${duel.error}`);
        return;
      }
      sendMessageWithSave(bot, chat, `Duel in tournament created between ${cmdData[2]}, ${cmdData[3]}`);
      return;
      break;
    case admin_commands[1]:
      if (active) {
        sendMessageWithSave(bot, chat, `Tournament is now active`);
        return;
      }
      const tId = await createTournament();
      if (tId.error) {
        sendMessageWithSave(
          bot,
          chat,
          `Tournament creation error: ${tId.error}`,
        );
        return;
      } else {
        sendMessageWithSave(bot, chat, `New tournament created`);
        return;
      }
      break;
    case admin_commands[2]:
      if (!active) {
        sendMessageWithSave(bot, chat, `No active tournament`);
        return;
      }
      const parts = await getParticipantsIds();
      sendMessageWithSave(
        bot,
        chat,
        `Tournament participants: ${parts.join(', ')}`,
      );
      return;
      break;
    case admin_commands[3]: 
      return downloadReferralStats(bot, msg)
    case admin_commands[3]: 
      return sendMessageWithSave(
        bot,
        chat,
        `Write your post. Warning! Next message will sent for all users!`,
      );
    default:
      sendMessageWithSave(
        bot,
        chat,
        `Unknwn command, available ${admin_commands.join(', ')}`,
      );
      return;
  }
};
