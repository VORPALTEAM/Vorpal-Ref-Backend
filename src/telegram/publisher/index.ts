import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import { Readable } from "stream";
import { massSendMessageThroughQueue, massSendPhotoThroughQueue, sendMessageWithSave, sendPhotoWithSave } from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { adminCmdPreprocess, escapeHTML, escapeMarkdownV2, setupBotMenu } from './functions';
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
    console.log("Session info: ", session.textPost, session.photoPost);
    if (!session.textPost && !session.photoPost) {
        sendMessageWithSave(publisherBot, chat, `Please, create post at first`);
        return;
    }
    session.setLastAction("init");
    sendMessageWithSave(publisherBot, chat, `Message sending started`);
    if (session.photoPost) {
        massSendPhotoThroughQueue(Bot, session.photoPost?.img || "", session.photoPost?.text, {
            parse_mode: "HTML"
        });
        return;
    }
    if (session.textPost) {
        massSendMessageThroughQueue(Bot, session.textPost || "", {
            parse_mode: "HTML"
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
        session.textPost = msg.text;
        console.log("Text: ", session.textPost);  
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            sendMessageWithSave(publisherBot, chat, msg.text || "", {
                parse_mode: "HTML"
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

  publisherBot.on("photo", async (msg) => {
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;

    const session = getAdminSession(chat);
    const action = session.getLastAction();

    if (action === "init_post") {
        if (!msg.photo || msg.photo.length === 0) {
            sendMessageWithSave(publisherBot, chat, "No photo in message");
            return;
        }
        const photo = msg.photo[msg.photo.length - 1];  // Use the highest resolution photo
        const file = await publisherBot.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${api_token}/${file.file_path}`;

        const response = await fetch(fileUrl);
        console.log("Url responce:" , response.ok);
        if (!response.ok || !response?.body) {
            sendMessageWithSave(publisherBot, chat, "Failed to load photo");
            return;
        }
        const localFilePath = `./downloads/${file.file_path?.split('/').pop()}`;
        console.log("loaded photo: ", localFilePath);
        const writer = fs.createWriteStream(localFilePath);
        /* const msg = await Bot.sendPhoto(chat, file.file_unique_id, {
            caption: message,
            ...options
          }); */

        Readable.fromWeb(response.body).pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(localFilePath));
            writer.on('error', reject);
        });
        const newFile = await sendPhotoWithSave(Bot, chat, localFilePath, "", true, {});
        if (!newFile) {
            sendMessageWithSave(publisherBot, chat, "Failed to resend photo");
            return;
        }
        session.photoPost = { img: newFile || "", text: msg.caption};
        sendMessageWithSave(publisherBot, chat, `Look at your photo post and send it if ok: `);
        setTimeout(() => {
            publisherBot.sendPhoto(chat, photo.file_id, {
                caption: session.photoPost?.text,
                parse_mode: "HTML"
            });
        }, 1101);
        session.setLastAction("post_written");
    }
  })
}
