import TelegramBot from 'node-telegram-bot-api';
import { massSendMessageThroughQueue, sendMessageWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { adminCmdPreprocess, escapeMarkdownV2, setupBotMenu } from './functions';
import { Bot } from '../../telegram/bot';

const api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;

export const publisherBot = api_token? new TelegramBot(api_token || '', { polling: true }) : null;

export function initPublisherBot() {
  console.log('Publisher started');
  if (!publisherBot) return;
  setupBotMenu(publisherBot, menu);

  publisherBot.onText(/\/start/, async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Choose /newpost to start posting`);
    const session = getAdminSession(chat);
  });
  publisherBot.onText(/\/newpost/, async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.setLastAction("init_post");
    session.textPost = undefined;
    session.photoPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `All right, a new post. Enter a post conent below:`);
  });
  publisherBot.onText(/\/addkeyboard/, async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    if (!session.textPost && !session.photoPost) {
        sendMessageWithSave(publisherBot, chat, `Please, enter the post content at first`);
        return;
    }
    sendMessageWithSave(publisherBot, chat, `Enter message with name and url with space as a Link https://site.com`);
    session.setLastAction("enter_keyboard");
  });
  publisherBot.onText(/\/confirmpost/, async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    if (!session.textPost && !session.photoPost) {
        sendMessageWithSave(publisherBot, chat, `Please, create post at first`);
        return;
    }
    session.setLastAction("init");
    sendMessageWithSave(publisherBot, chat, `Message sending started`);
    if (session.photoPost) {
        // massSendMessageThroughQueue(Bot, session.textPost || "", )
        return;
    }
    if (session.textPost) {
        massSendMessageThroughQueue(Bot, escapeMarkdownV2(session.textPost || ""), {
            parse_mode: "MarkdownV2"
        })
        return;
    }
  });
  publisherBot.onText(/\/cancelpost/, async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.setLastAction("init");
    session.textPost = undefined;
    session.photoPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `Post creation cancelled`);
  });

  publisherBot.on('message', async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    if (!msg.text || !notABusyRegex(msg.text, commands)) {
       return;
    }
    const session = getAdminSession(chat);
    const action = session.getLastAction();
    if (action === "init_post") {
        session.textPost = escapeMarkdownV2(msg.text);
        console.log("Text: ", session.textPost);  
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            sendMessageWithSave(publisherBot, chat, escapeMarkdownV2(msg.text || ""), {
                parse_mode: "MarkdownV2"
            });
        }, 1101);
        return;
    }
    if (action === "enter_keyboard") {
        const chat = await adminCmdPreprocess(publisherBot, msg);
        if (!chat) return;
        session.textPost = msg.text;
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            sendMessageWithSave(publisherBot, chat, msg?.text || "");
        }, 1101);
        return;
    }
    session.setLastAction("post_written");
  });
}
