import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';

const api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;

export const publisherBot = new TelegramBot(api_token || "");

export function initPublisherBot() {
    console.log("Bot strted: ")
    publisherBot.onText(/\/start/, async (msg) => {
        const chat = msg?.from?.id;
        console.log("Received: ", chat, msg.text);
        if (!chat) return;
        const user = await getUserData(String(chat));
        const isAdmin = user?.role_id === 2
        sendMessageWithSave(publisherBot, chat, `Your id is: ${msg?.from?.id}, you admin: ${isAdmin}`);
    })
    publisherBot.on("message", async (msg) => {
        const chat = msg?.from?.id;
        console.log("Received: ", chat, msg.text);
        if (!chat) return;
        const user = await getUserData(String(chat));
        const isAdmin = user?.role_id === 2
        sendMessageWithSave(publisherBot, chat, `Your id is: ${msg?.from?.id}, you admin: ${isAdmin}`);
    })
}

