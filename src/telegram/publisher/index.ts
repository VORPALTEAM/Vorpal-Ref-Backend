import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';

const api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;

export const publisherBot = new TelegramBot(api_token || "");

export function initPublisherBot() {
    publisherBot.on("text", async (msg) => {
        const chat = msg?.from?.id;
        if (!chat) return;
        const user = await getUserData(String(chat));
        const isAdmin = user?.role_id === 2
        sendMessageWithSave(publisherBot, chat, `Your id is: ${msg?.from?.id}, you admin: ${isAdmin}`);
    })
}

