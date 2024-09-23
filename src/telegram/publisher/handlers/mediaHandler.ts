import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from 'fs';
import { Bot } from '../../bot';
import {
  sendMediaWithSave,
  sendMessageWithSave,
  sendPhotoWithSave,
} from '../../handlers/utils';
import { photoDirectory, publisher_api_token, publisherBot } from '../initial';
import { adminCmdPreprocess } from '../functions';
import { getAdminSession } from '../session';
import { TelegramMediaType } from '../../../types';

export const mediaHandler = async (
  msg: TelegramBot.Message,
  type: TelegramMediaType = 'animation',
) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;

  const session = getAdminSession(chat);
  const action = session.getLastAction();

  if (action === 'init_post') {
    if (!publisherBot) return;
    /* if ((!msg.photo || msg.photo.length === 0) && !msg.video) {
      sendMessageWithSave(publisherBot, chat, 'No media in message');
      return;
    }*/
    const mediaFile: string = (() => {
      switch (true) {
        case !!msg.animation:
          return msg.animation?.file_id || "";
        case !!msg.video:
          return msg.video?.file_id || "";
        case !!msg.photo && msg.photo.length > 0:
          return msg.photo && msg.photo.length > 0
            ? msg.photo[msg.photo.length - 1].file_id
            : '';
        case !!msg.audio:
          return msg.audio?.file_id || "";
        case !!msg.document:
          return msg.document?.file_id || "";
        case !!msg.voice:
          return msg.voice?.file_id || "";
        case !!msg.video_note:
          return msg.video_note?.file_id || "";
        case !!msg.sticker:
          return msg.sticker?.file_id || "";
        default:
          return '';
      }
    })();
    if (!mediaFile) {
      sendMessageWithSave(publisherBot, chat, "Media file not found");
      return;
    }
    const file = await publisherBot.getFile(mediaFile);
    const fileUrl = `https://api.telegram.org/file/bot${publisher_api_token}/${file.file_path}`;
    console.log('Url: ', fileUrl);
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const localFilePath = `${photoDirectory}/${file.file_path
      ?.split('/')
      .pop()}`;
    console.log('loaded photo: ', localFilePath);
    const writer = fs.createWriteStream(localFilePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(localFilePath));
      writer.on('error', reject);
    });
    const newFile = await sendMediaWithSave(
      Bot,
      chat,
      localFilePath,
      '',
      type,
      true,
      {},
    );
    console.log("New file id: ", newFile);
    if (!newFile) {
      sendMessageWithSave(publisherBot, chat, 'Failed to resend photo');
      return;
    }
    session.mediaPost = {
      img: newFile || '',
      text: msg.caption,
      type,
    };
    sendMessageWithSave(
      publisherBot,
      chat,
      `Look at your photo post and send it if ok: `,
    );
    setTimeout(() => {
      if (publisherBot)
        /* 
           // It's working ok: 
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
        sendMediaWithSave(bot, users[index].chat_id, fileId, message || "", type, false, options)
        */
        sendMediaWithSave(
          publisherBot,
          chat,
          newFile,
          session.mediaPost?.text || '',
          type,
          false,
          {
            parse_mode: 'HTML',
          },
        );
    }, 9901);
    session.setLastAction('post_written');
  }
};
