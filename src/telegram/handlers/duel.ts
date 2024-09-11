import TelegramBot from 'node-telegram-bot-api';
import {
  addDuelOpponent,
  deleteDuel,
  finishDuel,
  getDuelDataByUser,
  getOpponent,
  getPersonalDataById,
  getUserTransactions,
  removeDuelOpponent,
} from '../../models/telegram';
import { duel_lifetime } from '../../config';
import { duelText, inviteLink, messages, startText } from '../constants';
import { InlineKeyboard } from './keyboard';
import { sendMessageWithSave } from './utils';
import { notifyDuelFinishFor } from '../../models/external';
import { Bot } from '../bot';
import { createUserIfNotExists, getUserId } from '../../models/user';

export const duelCancelAction = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  opponent: string = '',
) => {
  if (!query.message?.chat.id) {
    console.log('Chat not found');
    return;
  }
  const chatId = query.message.chat.id;
  const sender: string = String(query?.from?.id || '');
  const userId = await getUserId(String(chatId));
  if (!userId) {
    sendMessageWithSave(Bot, chatId, "Unknown error");
    return;
  }
  if (sender) {
    const duel = await getDuelDataByUser(userId);
    console.log('Cancelled duel: ', duel);
    if (duel && duel.is_finished) {
      sendMessageWithSave(Bot, chatId, "Duel is already finished");
      return;
    }
    if (duel) {
      /* if (duel.login2) {
        try {
          NotifyDuelFinishFor(duel.login2);
        } catch (e) {
          console.log(e.message);
        }
      } */
      await deleteDuel(Number(duel.id));
      // await FinishDuel(duel.duel_id, '');
      sendMessageWithSave(Bot, chatId, messages.duelCancelled, {
        reply_markup: InlineKeyboard(['enterGame', 'duel']),
      });
    } else {
      sendMessageWithSave(Bot, chatId, messages.duelNotFound, {
        reply_markup: InlineKeyboard(['enterGame', 'duel']),
      });
    }
  } else {
    sendMessageWithSave(Bot, chatId, messages.duelNotFound, {
      reply_markup: InlineKeyboard(['enterGame', 'duel']),
    });
  }
};

export const duelAcceptAction = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  inviter: string,
) => {
  if (!query.message?.chat.id) {
    console.log('Chat not found');
    return;
  }
  const inviterId = await getUserId(inviter);
  if (!inviterId) {
    bot.sendMessage(query.message.chat.id, messages.duelNotFound);
    return;
  }
  const duel = await getDuelDataByUser(inviterId);

  if (!duel) {
    bot.sendMessage(query.message.chat.id, messages.duelNotFound);
    return;
  }
  const player = await createUserIfNotExists(String(query?.message?.from?.id || ''));

  /* if (!player) {
    bot.sendMessage(query.message.chat.id, messages.noUsername);
    return;
  } */

  await addDuelOpponent(Number(duel.id), player);
  bot.sendMessage(query.message.chat.id, messages.duelComfirmed);
  if (inviter && player) {
    const opponentData = await getPersonalDataById(Number(inviter));
    const from = query?.message?.from
    if (opponentData) {
      sendMessageWithSave(
        Bot,
        opponentData.chat_id,
        messages.duelAcceptNotify(from?.username || from?.first_name || "Anonimous", from?.username ? true : false),
      );
    }
  }
};

export const duelRefuseAction = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  inviter: string,
) => {
  if (!query.message?.chat.id) {
    console.log('Chat not found');
    return;
  }
  const caller = query?.from?.id;
  if (!caller || !query.from || !query.from.username) {
    return;
  }
  const userId = await createUserIfNotExists("user", undefined, undefined, query.from)
  const duelOpponent = ((await getOpponent(userId)) || inviter);
  const opponentData = await getPersonalDataById(Number(duelOpponent));
  const duelData = await getDuelDataByUser (userId);

  if (opponentData) {

      try {
        notifyDuelFinishFor(String(opponentData.id), duelData?.id || "");
      } catch (e) {
        console.log("Notify err");
      } 

    sendMessageWithSave(
      Bot,
      opponentData.chat_id,
      messages.duelCancelOpponentNotify(String(query.from.id)),
    );
    sendMessageWithSave(
      Bot,
      query.message.chat.id,
      messages.duelCancelYouNotify(opponentData.username || opponentData.first_name),
    );
    const callerId = await getUserId(String(caller));
    const removeResult = callerId && await removeDuelOpponent(callerId);

    sendMessageWithSave(Bot, query.message.chat.id, messages.duelRefused, {
      reply_markup: InlineKeyboard(['enterGame', 'duel']),
    });
  }

};

export const txnHistoryAction = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
) => {
  if (!query.message) return;
  if (!query.from) {
    sendMessageWithSave(Bot, query.message.chat.id, messages.noUsername);
    return;
  } 
  const transactions = await getUserTransactions(String(query.from?.id || ""));
  const historyText = `<b>Your transactions:</b>\n ${transactions.map((txn) => {
    return `${txn.resource === 'token' ? 'tVRP' : txn.resource} ${txn.amount} ${txn.reason}\n`;
  })}`;
  sendMessageWithSave(Bot, query.message.chat.id, historyText, {
    parse_mode: 'HTML',
  });
  return;
};
