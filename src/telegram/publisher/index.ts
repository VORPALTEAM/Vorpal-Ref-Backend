import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';

const api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;

export const publisherBot = new TelegramBot(api_token || "", { polling: true });

export function initPublisherBot() {
    console.log("Publisher started")
    publisherBot.on("message", async (msg) => {
        const chat = msg?.from?.id;
        console.log("Received: ", chat, msg.text);
        if (!chat) return;
        const user = await getUserData(String(chat));
        const isAdmin = user?.role_id === 2;
        if (!isAdmin) {
            sendMessageWithSave(publisherBot, chat, `Function allowed for admins only`);
            return;
        }
        const session = getAdminSession(String(chat));
        sendMessageWithSave(publisherBot, chat, `Sending text: ${msg.text}, action: ${session.getLastAction()}`);
        session.setLastAction("post");
    })
}

