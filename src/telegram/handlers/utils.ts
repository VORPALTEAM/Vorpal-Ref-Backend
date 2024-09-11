import fs from 'fs';
import {
  deleteMessagesByChatId,
  getMessagesByChatId,
  saveMessage,
} from '../../models/telegram/history';
import TelegramBot from 'node-telegram-bot-api';

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
