import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { TelegramAuthData, tgChannelData } from '../../types';
import { getDaylyAuthDate, createTelegramAuthHash } from '../../utils/auth';
import { sendSubscribeMessage } from './subscribe';
import { duel_lifetime, testPhotoUrl } from '../../config';
import { InlineKeyboard } from './keyboard';
import {
  createDuel,
  finishDuel,
  getDuelDataByUser,
} from '../../models/telegram';
import {
  duelConfirmText,
  duelRefuseText,
  duelText,
  inviteLink,
  messages,
  startText,
} from '../constants';
import { sendMessageWithSave, sendPhotoWithSave } from './utils';
import { saveMessage } from '../../models/telegram/history';
import { Bot } from '../bot';
import { createUserIfNotExists } from 'models/user';

export const invitePhotoPath = '/app/public/duel.png';

export const duelCreationHandler = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery | TelegramBot.Message,
) => {
  let chatId: number;
  let userId: number;
  let firstName: string;
  let lastName: string;
  let username: string | undefined;

  if ('message_id' in query) {
    if (!query.from) return;
    chatId = query.chat.id;
    userId = query.from.id;
    firstName = query.from.first_name?.replace(' ', '') || '';
    lastName = query.from.last_name?.replace(' ', '') || '';
    username = query.from.username?.toLowerCase();
  } else {
    if (!query.message) return;
    chatId = query.message.chat.id;
    userId = query.from.id;
    firstName = query.from.first_name?.replace(' ', '') || '';
    lastName = query.from.last_name?.replace(' ', '') || '';
    username = query.from.username?.toLowerCase();
  }

  const linkAuthDataPrev: TelegramAuthData = {
    auth_date: getDaylyAuthDate(),
    last_name: lastName?.replace(' ', '') || '',
    first_name: firstName?.replace(' ', '') || '',
    id: userId,
    username: username?.toLowerCase() || '',
    hash: '',
  };

  const existUserId = await createUserIfNotExists("user", undefined, undefined, linkAuthDataPrev);

  /* if (!linkAuthDataPrev.username) {
    SendMessageWithSave(Bot, chatId, messages.noUsername);
    return;
  } */
  const dateSec = Math.round(new Date().getTime() / 1000);
  const userLastDuel = await getDuelDataByUser(existUserId);
  if (!userLastDuel) {
    await createDuel(existUserId);
  } else {
    const isFinished = userLastDuel.is_finished;
    const creation = Number(userLastDuel.creation);
    if (
      !isFinished &&
      dateSec - creation < duel_lifetime &&
      userLastDuel.id1 &&
      userLastDuel.id2
    ) {
      sendMessageWithSave(Bot, chatId, messages.duelAlready);
      return;
    }
    if (!isFinished || dateSec - creation >= duel_lifetime) {

      await finishDuel(Number(userLastDuel.id), null);
    }
    const duelId = await createDuel(existUserId);
  }

  await sendMessageWithSave(Bot, chatId, messages.duelToForward).then(() => {
    sendPhotoWithSave(
      Bot,
      chatId,
      invitePhotoPath,
      messages.duelInvitation(
        String(linkAuthDataPrev.username || linkAuthDataPrev.first_name || ''),
        linkAuthDataPrev.id,
        linkAuthDataPrev.username ? true : false,
      ),
      true,
      {
        parse_mode: 'HTML',
      },
    ).then(() => {
      sendMessageWithSave(Bot, chatId, messages.duelCancelDescript, {
        reply_markup: InlineKeyboard(['duelCancel']),
      });
    });
  });
};
