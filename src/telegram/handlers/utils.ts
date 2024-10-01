import fs from 'fs';
import {
  deleteMessagesByChatId,
  getMessagesByChatId,
  saveMessage,
} from '../../models/telegram/history';
import TelegramBot from 'node-telegram-bot-api';
import { getAllTelegramUsers } from '../../models/user';
import { messageSendingInterval } from '../../config';
import { TelegramMediaType } from '../../types';
import { AdminSession } from '../publisher/session';

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
          return msg.photo?.[msg.photo.length - 1].file_id; // Highest resolution photo
        case "video":
          return msg.video?.file_id;
        case "audio":
          return msg.audio?.file_id;
        case "animation":
          return msg.animation?.file_id;
        case "document":
          return msg.document?.file_id;
        case "voice":
          return msg.voice?.file_id;
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

export function retrySendMediaWithTimeout(
  bot: TelegramBot,
  chatId: number,
  session: AdminSession,
  type: string,
  intervalTime = 10000,
  maxDuration = 600000, // Maximum 10 minutes
  options: TelegramBot.SendMessageOptions = { parse_mode: 'HTML' },
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const currentTime = Date.now();
        if (currentTime - startTime >= maxDuration) {
          clearInterval(interval);
          console.log('Retry time limit reached, stopping further attempts.');
          resolve(false); // Resolve as false when the time limit is reached
          return;
        }

        // Attempt to send media
        console.log('Attempting to resend media...');
        const success = await sendMediaWithSave(
          bot,
          chatId,
          session.mediaPost?.img || '',
          session.mediaPost?.text || '',
          type,
          false,
          options,
        );

        // If the media is successfully sent, resolve the Promise
        if (success) {
          console.log('Media sent successfully!');
          clearInterval(interval);
          resolve(true); // Resolve as true when media is successfully sent
        } else {
          console.log('Failed to send media, retrying...');
          sendMessageWithSave(bot, chatId, "Waiting to send media...")
        }

      } catch (e) {
        console.log('Error during retry:', e.message);
        clearInterval(interval);
        reject(e); // Reject the Promise on error
      }
    }, intervalTime); // Set the retry interval
  });
}