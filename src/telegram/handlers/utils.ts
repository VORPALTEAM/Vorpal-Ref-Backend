import fs from 'fs';
import {
  deleteMessagesByChatId,
  getMessagesByChatId,
  saveMessage,
} from '../../models/telegram/history';
import TelegramBot from 'node-telegram-bot-api';
import { getAllTelegramUsers } from '../../models/user';
import { messageSendingInterval } from '../../config';
import { TelegramMediaType } from 'types';

export async function sendPhotoWithSave(
  bot: TelegramBot,
  chatId: number,
  photoPath: string,
  message: string,
  isLocal?: boolean,
  options?: TelegramBot.SendMessageOptions,
  isVideo?: boolean
) {
  try {
    const msg = isVideo ?
    await bot.sendVideo(chatId, isLocal? fs.createReadStream(photoPath) : photoPath, {
      caption: message,
      ...options
    }) :
    await bot.sendPhoto(chatId, isLocal? fs.createReadStream(photoPath) : photoPath, {
      caption: message,
      ...options
    });
    if (msg.photo && msg.photo.length > 0) {
      const newFileId = msg.photo[msg.photo.length - 1].file_id; // Get the highest resolution file_id
      return newFileId; // Return the new file_id
    }

    // await saveMessage(chatId, msg.message_id);
    return false;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

export async function sendMediaWithSave(
  bot: TelegramBot,
  chatId: number,
  mediaPath: string,
  message: string,
  mediaType: string, // audio | video | photo | animation | document | voice
  isLocal?: boolean,
  options?: TelegramBot.SendMessageOptions,
) {
  try {
    const msg = await (async () => {
      switch (mediaType) {
        case "photo":
          return await bot.sendPhoto(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        case "video":
          return await bot.sendVideo(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        case "audio":
          return await bot.sendAudio(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        case "animation":
          return await bot.sendAnimation(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        case "document":
          return await bot.sendDocument(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        case "voice":
          return await bot.sendVoice(chatId, isLocal ? fs.createReadStream(mediaPath) : mediaPath, {
            caption: message,
            ...options
          });
        default:
          throw new Error(`Unsupported media type: ${mediaType}`);
      }
    })();
    
    // Extract and return file_id based on the media type
    const fileId = (() => {
      switch (mediaType) {
        case "photo":
          return msg.photo?.[msg.photo.length - 1].file_id;  // Highest resolution photo
        case "video":
        case "audio":
        case "animation":
        case "document":
        case "voice":
          return msg[mediaType]?.file_id;  // For single file media types like video, audio, etc.
        default:
          return null;
      }
    })();

    if (!fileId) throw new Error("Failed to retrieve file_id");

    return fileId; // Return the new file_id for the media

  } catch (e) {
    console.log(e.message);
    return false;
  }
}

export async function sendMessageWithSave(
  bot: TelegramBot,
  chatId: number,
  message: string,
  options?: TelegramBot.SendMessageOptions,
) {
  try {
    const msg = await bot.sendMessage(chatId, message, options);
    // await saveMessage(chatId, msg.message_id);
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

export async function truncateChat(bot: TelegramBot, chatId: number) {
  const messages = await getMessagesByChatId(chatId);
  let isCatch = false;
  for (let j = 0; j < messages.length; j++) {
    try {
        await bot.deleteMessage(chatId, messages[j]);
    } catch (e) {
        console.log(e.message);
        isCatch = true;
    }
  }
  if (!isCatch) await deleteMessagesByChatId(chatId);
}

export async function massSendMessageThroughQueue(bot: TelegramBot, message: string,
  options?: TelegramBot.SendMessageOptions,) {
    return new Promise(async (resolve, reject) => {
      const users = await getAllTelegramUsers();
      let index = 0;
      const queue = setInterval(async () => {
        index++;
        await sendMessageWithSave(bot, users[index].chat_id,message, options)
        if (index >= users.length - 1) {
          clearInterval(queue);
          resolve(true);
        }
      }, messageSendingInterval)
    })
}

export async function massSendPhotoThroughQueue(
  bot: TelegramBot, photoId: string, message?: string,
  options?: TelegramBot.SendMessageOptions, isVideo?: boolean) {
    return new Promise(async (resolve, reject) => {
      const users = await getAllTelegramUsers();
      let index = 0;
      const queue = setInterval(async () => {
        index++;
        try {
          isVideo? 
          await bot.sendVideo (users[index].chat_id, photoId, {
            caption: message,
            ...options
          }) :
          await bot.sendPhoto(users[index].chat_id, photoId, {
            caption: message,
            ...options
          });
          // await saveMessage(chatId, msg.message_id);
        } catch (e) {
          console.log(e.message);
        }
        if (index >= users.length - 1) {
          clearInterval(queue);
          resolve(true);
        }
      }, messageSendingInterval)
    })
}

export async function massSendMediaThroughQueue(
  bot: TelegramBot, fileId: string, message: string, type: TelegramMediaType,
  options?: TelegramBot.SendMessageOptions) {
    return new Promise(async (resolve, reject) => {
      const users = await getAllTelegramUsers();
      let index = 0;
      const queue = setInterval(async () => {
        index++;
        try {
          sendMediaWithSave(bot, users[index].chat_id, fileId, message || "", type, false, options)
          // await saveMessage(chatId, msg.message_id);
        } catch (e) {
          console.log(e.message);
        }
        if (index >= users.length - 1) {
          clearInterval(queue);
          resolve(true);
        }
      }, messageSendingInterval)
    })
}