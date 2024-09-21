import fs from 'fs';
import {
  deleteMessagesByChatId,
  getMessagesByChatId,
  saveMessage,
} from '../../models/telegram/history';
import TelegramBot from 'node-telegram-bot-api';
import { getAllTelegramUsers } from '../../models/user';
import { messageSendingInterval } from '../../config';

export async function sendPhotoWithSave(
  bot: TelegramBot,
  chatId: number,
  photoPath: string,
  message: string,
  isLocal?: boolean,
  options?: TelegramBot.SendMessageOptions,
) {
  try {
    const msg = await bot.sendPhoto(chatId, isLocal? fs.createReadStream(photoPath) : photoPath, {
      caption: message,
      ...options
    });
    // await saveMessage(chatId, msg.message_id);
    return true;
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
