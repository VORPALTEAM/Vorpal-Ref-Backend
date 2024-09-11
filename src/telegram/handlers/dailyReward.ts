import TelegramBot from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { createNewBox } from '../../models/rewards';
import { sendMessageWithSave } from './utils';
import { messages } from '../constants';
import { InlineKeyboard } from './keyboard';
import { getChannelSubscribeList, sendSubscribeMessage } from './subscribe';
import { createUserIfNotExists } from '../../models/user';

const lastRewardDate = new Map<number, number>()

export const dailyRewardHandler = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    if (!msg.from) {
        return;
    }
    const chatId = msg.chat.id;
    const now = new Date().getTime();
    const fromId = msg.from?.id;
    const fromLang = msg.from?.language_code || 'en'

    const lastReward = lastRewardDate.get(fromId);

    const subscribes = await getChannelSubscribeList(fromId, fromLang);

    if (subscribes.length > 0) {
        await sendSubscribeMessage(fromId, chatId, fromLang);
        return;
    }
    const userId = await createUserIfNotExists ("user", undefined, undefined, msg.from)

    if (!lastReward || now - lastReward >= 86400000) {
        await createNewBox(1, userId);
        lastRewardDate.set(fromId, now);
        await sendMessageWithSave(bot, chatId, messages.dailyRewardOk,
            { reply_markup: InlineKeyboard(['enterGameReward']) },);
    } else {
        await sendMessageWithSave(bot, chatId, messages.dailyRewardRefuse);
    }
}