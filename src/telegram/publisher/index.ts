import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import axios from 'axios';
import { massSendMediaThroughQueue, massSendMessageThroughQueue, massSendPhotoThroughQueue, sendMessageWithSave, sendPhotoWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { adminCmdPreprocess, setupBotMenu } from './functions';
import { Bot } from '../../telegram/bot';
import { photoDirectory, publisherBot, publisher_api_token } from './initial';
import { mediaHandler } from './handlers/mediaHandler';
import { textHandler } from './handlers/textHandler';
import { TelegramMediaType } from 'types';

const mediaTypes: TelegramMediaType[] = ['photo', 'video', 'audio', 'document', 'voice', 'animation'];


export function initPublisherBot() {
    if (!fs.existsSync(photoDirectory)) {
        fs.mkdirSync(photoDirectory, { recursive: true });
    }

  console.log('Publisher started');
  if (!publisherBot) return;
  setupBotMenu(publisherBot, menu);
  if (!publisherBot) return;


  publisherBot.onText(/\/start/, async (msg) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Choose /newpost to start posting`);
    const session = getAdminSession(chat);
  });
  publisherBot.onText(/\/newpost/, async (msg) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.setLastAction("init_post");
    session.textPost = undefined;
    session.mediaPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `All right, a new post. Enter a post conent below:`);
  });
  publisherBot.onText(/\/addkeyboard/, async (msg) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    if (!session.textPost && !session.mediaPost) {
        sendMessageWithSave(publisherBot, chat, `Please, enter the post content at first`);
        return;
    }
    sendMessageWithSave(publisherBot, chat, `Enter message with name and url with space as a Link https://site.com`);
    session.setLastAction("enter_keyboard");
  });
  publisherBot.onText(/\/confirmpost/, async (msg) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    console.log("Session info: ", session.textPost, session.mediaPost);
    if (!session.textPost && !session.mediaPost) {
        sendMessageWithSave(publisherBot, chat, `Please, create post at first`);
        return;
    }
    session.setLastAction("init");
    sendMessageWithSave(publisherBot, chat, `Message sending started`);
    if (session.mediaPost) {
        massSendMediaThroughQueue(Bot, 
          session.mediaPost?.img || "", 
          session.mediaPost?.text || "", 
          session.mediaPost.type,
          {
            parse_mode: "HTML",
            reply_markup: session.postKeyboard ? {
                inline_keyboard: session.postKeyboard
            } : undefined
        });
        return;
    }
    if (session.textPost) {
        massSendMessageThroughQueue(Bot, session.textPost || "", {
            parse_mode: "HTML",
            reply_markup: session.postKeyboard ? {
                inline_keyboard: session.postKeyboard
            } : undefined
        })
        return;
    }
  });
  publisherBot.onText(/\/cancelpost/, async (msg) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.setLastAction("init");
    session.textPost = undefined;
    session.mediaPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `Post creation cancelled`);
  });

  publisherBot.on('message', async (msg) => {
    await textHandler(msg)
  });

  mediaTypes.forEach((type) => {
    if (!publisherBot) return;
    publisherBot.on(type, async (msg) => {
      await mediaHandler(msg, type)
    })
  })
}
