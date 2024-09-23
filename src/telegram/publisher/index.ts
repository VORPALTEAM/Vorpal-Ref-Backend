import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import axios from 'axios';
import { massSendMessageThroughQueue, massSendPhotoThroughQueue, sendMessageWithSave, sendPhotoWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { adminCmdPreprocess, setupBotMenu } from './functions';
import { Bot } from '../../telegram/bot';
import { photoDirectory, publisherBot, publisher_api_token } from './initial';
import { mediaHandler } from './handlers/mediaHandler';
import { textHandler } from './handlers/textHandler';

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
    session.photoPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `All right, a new post. Enter a post conent below:`);
  });
  publisherBot.onText(/\/addkeyboard/, async (msg) => {
    if (!publisherBot) return;
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
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    console.log("Session info: ", session.textPost, session.photoPost);
    if (!session.textPost && !session.photoPost) {
        sendMessageWithSave(publisherBot, chat, `Please, create post at first`);
        return;
    }
    session.setLastAction("init");
    sendMessageWithSave(publisherBot, chat, `Message sending started`);
    if (session.photoPost) {
        massSendPhotoThroughQueue(Bot, session.photoPost?.img || "", session.photoPost?.text, {
            parse_mode: "HTML",
            reply_markup: session.postKeyboard ? {
                inline_keyboard: session.postKeyboard
            } : undefined
        }, !!session.photoPost?.video);
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
    session.photoPost = undefined;
    session.postKeyboard = undefined;
    sendMessageWithSave(publisherBot, chat, `Post creation cancelled`);
  });

  publisherBot.on('message', async (msg) => {
    await textHandler(msg)
  });

  publisherBot.on("photo", async (msg) => {
    await mediaHandler(msg)
  })

  publisherBot.on("video", async (msg) => {
    console.log("Video request called");
    await mediaHandler(msg)
  })

  publisherBot.on("animation", async (msg) => {
    console.log("Animatiom called");
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Animation called`);
    // await mediaHandler(msg)
  });

  publisherBot.on("video_note", async (msg) => {
    console.log("Video note called");
    // await mediaHandler(msg)
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    sendMessageWithSave(publisherBot, chat, `Video note called`);
  });
}
