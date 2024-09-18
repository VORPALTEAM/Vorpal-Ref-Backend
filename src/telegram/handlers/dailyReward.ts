import TelegramBot from 'node-telegram-bot-api';
import { Bot } from '../bot';
import { createNewBox } from '../../models/rewards';
import { sendMessageWithSave } from './utils';
import { messages } from '../constants';
import { InlineKeyboard } from './keyboard';
import { getChannelSubscribeList, sendSubscribeMessage } from './subscribe';
import { createUserIfNotExists } from '../../models/user';
import { addDailyRewardNote, getUserLastRewardDate } from '../../models/rewards/daily';
import { dateSec } from '../../utils/text';

function formatTime (seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secsStr}`;
}


export const dailyRewardHandler = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    if (!msg.from) {
        return;
    }
    const chatId = msg.chat.id;
    const now = dateSec();
    const fromId = msg.from?.id;
    const fromLang = msg.from?.language_code || 'en'


    const subscribes = await getChannelSubscribeList(fromId, fromLang);

    if (subscribes.length > 0) {
        await sendSubscribeMessage(fromId, chatId, fromLang);
        return;
    }
    const userId = await createUserIfNotExists ("user", undefined, undefined, msg.from)
   
    const lastReward = await getUserLastRewardDate(userId);
    if (!lastReward || now - lastReward >= 86400) {
        await createNewBox(1, userId);
        await  addDailyRewardNote(userId)
        await sendMessageWithSave(bot, chatId, messages.dailyRewardOk,
            { reply_markup: InlineKeyboard(['enterGameReward']) },);
    } else {
        const timeToStr = formatTime(now - lastReward);
        await sendMessageWithSave(bot, chatId, messages.dailyRewardTimer(timeToStr));
    }
}