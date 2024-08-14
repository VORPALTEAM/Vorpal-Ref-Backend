import { Markup } from 'telegraf';
import { TelegramAuthData, tgChannelData } from '../../types';
import { getDaylyAuthDate, createTelegramAuthHash } from '../../utils/auth';
import {
  addDuelOpponent,
  createDuel,
  finishDuel,
  getDuelDataByInviter,
  getDuelDataByUser,
  getWatchingChannels,
  setPersonalData,
} from '../../models/telegram';
import { duel_lifetime } from '../../config';
import { Bot } from '../bot';
import { duelText, inviteLink, messages, startText } from '../constants';
import { sendMessageWithSave } from './utils';

export async function sendSubscribeMessage(userId: number, chatId: number) {
  const subscribes = await getChannelSubscribeList(userId);

  const inlineButtons = subscribes.map((item) => ({
    text: item.name,
    url: `https://t.me/${item.username.replace('@', '')}`,
  }));

  const keyboardS = {
    inline_keyboard: [inlineButtons],
  };

  if (subscribes.length > 0) {
    await sendMessageWithSave(Bot, chatId, messages.subscribeRequest, {
      reply_markup: keyboardS,
    });
  }
}

export async function getChannelSubscribeList(
  userId: number,
): Promise<tgChannelData[]> {
  const channels = await getWatchingChannels();
  console.log('Subscriptions to watch: ', channels);
  const subscribes: tgChannelData[] = [];

  for (let j = 0; j < channels.length; j++) {
    // console.log("Channel: ", channels[j])
    try {
      const chatMember = await Bot.getChatMember(channels[j].id, userId);
      if (!chatMember) {
        continue;
      }
      console.log('Member status: ', chatMember.status);
      if (
        chatMember.status === 'member' ||
        chatMember.status === 'administrator' ||
        chatMember.status === 'creator'
      ) {
        continue;
      } else {
        subscribes.push(channels[j]);
      }
    } catch (e) {
      console.log('Chat error: ', String(channels[j].id), userId, e.message);
    }
  }
  return subscribes;
}
