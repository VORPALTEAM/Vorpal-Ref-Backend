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

  publisherBot.onText(/\/start/, async (msg) => {
    const chat = msg?.from?.id;
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
    sendMessageWithSave(publisherBot, chat, `Choose /newpost to start posting`);
    const session = getAdminSession(String(chat));
  });
  publisherBot.onText(/\/newpost/, async (msg) => {
    const chat = msg?.from?.id;
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
    session.setLastAction("init_post");
    session.textPost = null;
    session.photoPost = null;
    session.postKeyboard = null;
    sendMessageWithSave(publisherBot, chat, `All right, a new post. Enter a post conent below:`);
  });
  publisherBot.onText(/\/addkeyboard/, async (msg) => {
    const chat = msg?.from?.id;
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
    if (!session.textPost && !session.photoPost) {
        sendMessageWithSave(publisherBot, chat, `Please, enter the post content at first`);
        return;
    }
    sendMessageWithSave(publisherBot, chat, `Enter message with name and url with space as a Link https://site.com`);
    session.setLastAction("enter_keyboard");
  });
  publisherBot.onText(/\/confirmpost/, async (msg) => {
    const chat = msg?.from?.id;
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
    sendMessageWithSave(publisherBot, chat, `Started`);
  });
  publisherBot.onText(/\/cancelpost/, async (msg) => {
    const chat = msg?.from?.id;
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
    const action = session.getLastAction();
    if (action === "init_post") {
        session.textPost = msg.text;
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            sendMessageWithSave(publisherBot, chat, msg?.text || "");
        }, 1101);
        return;
    }
    if (action === "enter_keyboard") {
        session.textPost = msg.text;
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            sendMessageWithSave(publisherBot, chat, msg?.text || "");
        }, 1101);
        return;
    }
 
  });
}
