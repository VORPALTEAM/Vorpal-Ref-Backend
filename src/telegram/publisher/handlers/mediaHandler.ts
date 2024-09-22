import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from 'fs';
import { Bot } from '../../bot';
import { sendMessageWithSave, sendPhotoWithSave } from '../../handlers/utils';
import { photoDirectory, publisher_api_token, publisherBot } from '../initial';
import { adminCmdPreprocess } from '../functions';
import { getAdminSession } from '../session';

export const mediaHandler = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;

  const session = getAdminSession(chat);
  const action = session.getLastAction();

  if (action === 'init_post') {
    if (!publisherBot) return;
    if ((!msg.photo || msg.photo.length === 0) && !msg.video) {
      sendMessageWithSave(publisherBot, chat, 'No media in message');
      return;
    }
    const video = msg.video;
    const photo =
      msg.video ||
      (msg.photo && msg.photo.length > 0
        ? msg.photo[msg.photo.length - 1]
        : { file_id: '' }); // Use the highest resolution photo
    const file = await publisherBot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${publisher_api_token}/${file.file_path}`;

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
    /* const msg = await Bot.sendPhoto(chat, file.file_unique_id, {
            caption: message,
            ...options
          }); */
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(localFilePath));
      writer.on('error', reject);
    });
    const newFile = await sendPhotoWithSave(
      Bot,
      chat,
      localFilePath,
      '',
      true,
      {},
      !!msg.video,
    );
    if (!newFile) {
      sendMessageWithSave(publisherBot, chat, 'Failed to resend photo');
      return;
    }
    session.photoPost = {
      img: newFile || '',
      text: msg.caption,
      video: !!msg.video,
    };
    sendMessageWithSave(
      publisherBot,
      chat,
      `Look at your photo post and send it if ok: `,
    );
    setTimeout(() => {
      if (publisherBot)
        sendPhotoWithSave(
          publisherBot,
          chat,
          photo.file_id,
          session.photoPost?.text || '',
          true,
          {
            parse_mode: 'HTML',
          },
          !!msg.video,
        );
    }, 1101);
    session.setLastAction('post_written');
  }
};
