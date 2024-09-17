import TelegramBot from 'node-telegram-bot-api';
import { TelegramAuthData, tgChannelData } from '../../types';
import { getDaylyAuthDate, createTelegramAuthHash } from '../../utils/auth';
import { sendSubscribeMessage } from './subscribe';
import { duel_lifetime, tg_chat_history_lifetime } from '../../config';
import { InlineKeyboard } from './keyboard';
import {
  addDuelOpponent,
  getDuelDataByInviter,
  getDuelDataByUser,
  getOpponent,
  getPersonalDataById,
  setPersonalData,
} from '../../models/telegram';
import {
  duelConfirmText,
  duelRefuseText,
  duelText,
  inviteLink,
  messages,
  startText,
} from '../constants';
import { saveMessage } from '../../models/telegram/history';
import { sendMessageWithSave, truncateChat } from './utils';
import { getUserInviter } from '../../models/telegram/referral';
import { Bot } from '../bot';
import { createUserIfNotExists, getUserData, getUserId } from '../../models/user';

export const duelAcceptHandler = async (bot: TelegramBot, msg: any, match: any) => {
  const chatId = msg.chat.id;
  try {
    /* if (!msg.from.username) {
      SendMessageWithSave(Bot, chatId, messages.noUsername);
      return;
    } */
    // saveMessage(chatId, msg.message_id);

    const linkAuthDataPrev: TelegramAuthData = {
      auth_date: getDaylyAuthDate(),
      last_name: msg.from.last_name?.replace(' ', '') || '',
      first_name: msg.from.first_name?.replace(' ', ''),
      id: msg.from.id,
      username: msg.from.username?.toLowerCase() || '',
      hash: '',
    };

    const inviterLogin = match[1]?.toLowerCase();

    const inviterId = (await getUserData (inviterLogin))?.id;

    const userId = await createUserIfNotExists("user", undefined, inviterId, linkAuthDataPrev);

    // await SendSubscribeMessage(linkAuthDataPrev.id, chatId);

    /* if (!msg.from.username) {
      SendMessageWithSave(Bot, chatId, messages.noUsername);
      return;
    } */

    if (!inviterId) {
      sendMessageWithSave(Bot, chatId, messages.noInviter, {
        reply_markup: InlineKeyboard(['enterGame', 'duel']),
      });
      return;
    }

    if (inviterId === linkAuthDataPrev.id) {
      sendMessageWithSave(Bot, chatId, messages.inviteSelf);
      return;
    }
    
    const createdDuel = inviterId
      ? await getDuelDataByInviter(inviterId)
      : null;

    if (!createdDuel) {
      sendMessageWithSave(Bot, chatId, messages.duelNotFound, {
        reply_markup: InlineKeyboard(['enterGame', 'duel']),
      });
      return;
    }

    const timeNow = Math.round(new Date().getTime() / 1000);
    // ToDo: check duel condition
    if (
      createdDuel.is_finished &&
      timeNow - createdDuel.creation <= duel_lifetime
    ) {
      sendMessageWithSave(Bot, chatId, messages.duelCancelled, {
        reply_markup: InlineKeyboard(['enterGame','duel']),
      });
      return;
    }

    if (
      timeNow - createdDuel.creation > duel_lifetime
    ) {
      sendMessageWithSave(Bot, chatId, messages.duelExpired, {
        reply_markup: InlineKeyboard(['enterGame','duel']),
      });
      return;
    }

    if (
      (createdDuel.id2 &&
        createdDuel.id2 !== userId) ||
      createdDuel.is_finished ||
      timeNow - createdDuel.creation > duel_lifetime
    ) {
      sendMessageWithSave(Bot, chatId, messages.duelBusy, {
        reply_markup: InlineKeyboard(['enterGame', 'duel']),
      });
      return;
    }

    await addDuelOpponent(Number(createdDuel.id), userId);
    sendMessageWithSave(Bot, chatId, messages.duelAccept(inviterLogin), {
      reply_markup: InlineKeyboard(['duelConfirm', 'duelRefuse'], inviterLogin),
    });

    const opponentData = await getPersonalDataById(inviterId);
    if (opponentData) {
      try {
        sendMessageWithSave(
          Bot,
          opponentData.chat_id,
          messages.duelAcceptNotify(linkAuthDataPrev.username || linkAuthDataPrev.first_name || '', linkAuthDataPrev.username ? true : false),
          { reply_markup: InlineKeyboard(['duelConfirm']) },
        );
      } catch (e) {
        console.log(e.message);
      }
    }
    return;
  } catch (e) {
    console.log('Error: ', e.message);
    sendMessageWithSave(Bot, chatId, messages.serverError(e.message));
  }
  /* setTimeout(() => {
    truncateChat(Bot, chatId);
  }, tg_chat_history_lifetime); */
};
