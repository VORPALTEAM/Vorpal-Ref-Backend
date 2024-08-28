import TelegramBot from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { createNewBox } from '../../models/rewards';
import { sendMessageWithSave } from './utils';
import { messages } from '../constants';
import { InlineKeyboard } from './keyboard';

const lastRewardDate = new Map<number, number>()

export const dailyRewardHandler = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    if (!msg.from) {
        return;
    }
    const chatId = msg.chat.id;
    const now = new Date().getTime();
    const fromId = msg.from?.id;

    const lastReward = lastRewardDate.get(fromId);

    if (!lastReward || now - lastReward >= 86400000) {
        await createNewBox(1, String(fromId), String(fromId));
        lastRewardDate.set(fromId, now);
        await sendMessageWithSave(bot, chatId, messages.dailyRewardOk,
            { reply_markup: InlineKeyboard(['enterGameReward']) },);
    } else {
        await sendMessageWithSave(bot, chatId, messages.dailyRewardRefuse);
    }
}