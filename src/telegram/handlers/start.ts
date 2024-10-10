import TelegramBot from 'node-telegram-bot-api';
import { TelegramAuthData, tgChannelData } from '../../types';
import { getDaylyAuthDate, createTelegramAuthHash } from '../../utils/auth';
import { sendSubscribeMessage } from './subscribe';
import { duel_lifetime, tg_chat_history_lifetime } from '../../config';
import { InlineKeyboard, MarkupKeyboard } from './keyboard';
import { isUserInDuel, setPersonalData } from '../../models/telegram';
import { sendMessageWithSave, sendPhotoWithSave, truncateChat } from './utils';
import { messages } from '../constants';
import { deleteMessagesByChatId, saveMessage } from '../../models/telegram/history';
import { Bot } from '../bot';
import { createUserIfNotExists, getUserData, getUserId } from '../../models/user';
import { getParticipantsIds, isTournamentActive, takePartInTournament } from '../../models/tournament';

export const introPhotoPath = '/app/public/entry.png';

export const startHandler = async (bot: TelegramBot, msg: TelegramBot.Message, match: any) => {
  const chatId = msg.chat.id;
  // saveMessage(chatId, msg.message_id);
  if (!msg.from) return;
  console.log("Type: ", msg.chat.type, "id: ", chatId);
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') { 
    return;
  }
  try {
    const linkAuthDataPrev: TelegramAuthData = {
      auth_date: getDaylyAuthDate(),
      last_name: msg.from.last_name?.replace(' ', '') || '',
      first_name: msg.from.first_name?.replace(' ', ''),
      id: msg.from.id,
      username: msg.from.username?.toLowerCase() || '',
      hash: '',
    };

    const inviter = match[1]?.toLowerCase();
    // If this is a tournament registration
    if (inviter.indexOf("registerTour_") > -1) {
       try {
         const tourId = Number(inviter.replace("registerTour_", ""));
         if (isNaN(tourId)) {
          sendMessageWithSave(Bot, chatId, "Invaid tournament id");
          return;
         }
         const userId = await createUserIfNotExists(
          'user',
          undefined,
          undefined,
          msg.from,
         );
         const participants = await getParticipantsIds(tourId);
         if (participants.indexOf(String(chatId)) > -1) {
           sendMessageWithSave(Bot, chatId, 'You already in this tournament');
           return;
         }
         const isActive = await isTournamentActive(tourId);
         if (!isActive) {
          sendMessageWithSave(
            Bot,
            chatId,
            "Tournament is not active",
          );
          return;
         }
         await takePartInTournament(userId, tourId);
         sendMessageWithSave(
           Bot,
           chatId,
           'Welcome to a tournament. Wait for duel creation',
         );
         return;
       } catch (e) {
         sendMessageWithSave(Bot, chatId, `Failed on tournament registration: ${e}`);
         return;
       }
    }
    // const inviterId = await getUserId(inviterLogin);
    const inviterId = inviter ? Number(inviter) : undefined;
    const telegramInviter = inviter ? await (async () => {
      if (inviterId && inviterId > 0) {
        const telegramUser = await getUserData(String(inviterId).replace(" ", ""));
        if (telegramUser) {
          return Number(telegramUser.id);
        }
        return null;
      }
    })() : null;
    const inviterFiltered = telegramInviter || inviterId;
    const userId = await createUserIfNotExists("user", undefined, inviterFiltered || undefined, linkAuthDataPrev);

    /* if (!linkAuthDataPrev.username) {
      SendMessageWithSave(Bot, chatId, messages.noUsername);
      return;
    } */

    const isInDuel = await isUserInDuel(userId) 
      if (isInDuel) {
        sendMessageWithSave(Bot, chatId, messages.duelAlready);
        return;
      }

    // console.log('Last duel: ', createdDuel);
    const dateSec = Math.round(new Date().getTime() / 1000);

    await sendPhotoWithSave (Bot, chatId, introPhotoPath, messages.duelStart, true, {
      reply_markup: InlineKeyboard(['enterGame', 'duel', 'joinCommunity', 'referrals', 'dailyReward']),
    });
    // await SendSubscribeMessage(linkAuthDataPrev.id, chatId);

  } catch (e) {
    console.log('Start cmd exception: ', e);
    sendMessageWithSave(Bot, chatId, 'Bot-side error');
  }
  /* setTimeout(() => {
    TruncateChat(Bot, chatId)
  }, tg_chat_history_lifetime) */
};
