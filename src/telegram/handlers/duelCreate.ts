import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import { TelegramAuthData, tgChannelData } from '../../types';
import { GetDaylyAuthDate, CreateTelegramAuthHash } from '../../utils/auth';
import { SendSubscribeMessage } from './subscribe';
import { duel_lifetime, testPhotoUrl } from '../../config';
import { InlineKeyboard } from './keyboard';
import {
  CreateDuel,
  FinishDuel,
  GetDuelDataByUser,
} from '../../models/telegram';
import {
  duelConfirmText,
  duelRefuseText,
  duelText,
  inviteLink,
  messages,
  startText,
} from '../constants';
import { SendMessageWithSave, SendPhotoWithSave } from './utils';
import { SaveMessage } from '../../models/telegram/history';

export const invitePhotoPath = '/app/public/duel.png';

export const DuelCreationHandler = async (
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

  console.log('Duel handler called');

  const linkAuthDataPrev: TelegramAuthData = {
    auth_date: GetDaylyAuthDate(),
    last_name: lastName?.replace(' ', '') || '',
    first_name: firstName?.replace(' ', '') || '',
    id: userId,
    username: username?.toLowerCase() || '',
    hash: '',
  };

  console.log('Duel from user: ', linkAuthDataPrev);

  /* if (!linkAuthDataPrev.username) {
    SendMessageWithSave(bot, chatId, messages.noUsername);
    return;
  } */
  const dateSec = Math.round(new Date().getTime() / 1000);
  const userLastDuel = await GetDuelDataByUser(String(linkAuthDataPrev.id));
  if (!userLastDuel) {
    await CreateDuel(String(linkAuthDataPrev.id), '');
  } else {
    const isFinished = userLastDuel.isfinished;
    const creation = Number(userLastDuel.creation);
    if (
      !isFinished &&
      dateSec - creation < duel_lifetime &&
      userLastDuel.id1 &&
      userLastDuel.id2
    ) {
      console.log('Duel not created, already exists');
      SendMessageWithSave(bot, chatId, messages.duelAlready);
      return;
    }
    if (!isFinished || dateSec - creation >= duel_lifetime) {
      console.log('Finish duel case 3');
      await FinishDuel(userLastDuel.duel_id, '');
    }
    const duelId = await CreateDuel(String(linkAuthDataPrev.id), '');
    console.log('Created, id: ', duelId);
  }

  await SendMessageWithSave(bot, chatId, messages.duelToForward).then(() => {
    SendPhotoWithSave(
      bot,
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
      SendMessageWithSave(bot, chatId, messages.duelCancelDescript, {
        reply_markup: InlineKeyboard(['duelCancel']),
      });
    });
  });
};
