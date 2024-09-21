import TelegramBot from 'node-telegram-bot-api';
import { sendMessageWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { setupBotMenu } from './functions';

const api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;

export const publisherBot = api_token? new TelegramBot(api_token || '', { polling: true }) : null;

export function initPublisherBot() {
  console.log('Publisher started');
  if (!publisherBot) return;
  setupBotMenu(publisherBot, menu);

  publisherBot.onText(/\/start/, (msg) => {
    const chat = msg?.from?.id;
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Started`);
  });
  publisherBot.onText(/\/newpost/, (msg) => {
    const chat = msg?.from?.id;
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Started`);
  });
  publisherBot.onText(/\/addkeyboard/, (msg) => {
    const chat = msg?.from?.id;
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Started`);
  });
  publisherBot.onText(/\/confirmpost/, (msg) => {
    const chat = msg?.from?.id;
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Started`);
  });

  publisherBot.on('message', async (msg) => {
    const chat = msg?.from?.id;
    console.log('Received: ', chat, msg.text);
    if (!msg?.text || !notABusyRegex(msg?.text, commands)) {
      return;
    }
    if (!chat) return;
    const user = await getUserData(String(chat));
    const isAdmin = user?.role_id === 2;
    if (!isAdmin) {
      sendMessageWithSave(
        publisherBot,
        chat,
        `Function allowed for admins only`,
      );
      return;
    }
    const session = getAdminSession(String(chat));
    sendMessageWithSave(
      publisherBot,
      chat,
      `Sending text: ${msg.text}, action: ${session.getLastAction()}`,
    );
    session.setLastAction('post');
  });
}
