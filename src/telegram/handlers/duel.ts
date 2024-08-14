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
  if (sender) {
    const duel = await getDuelDataByUser(sender.toLowerCase());
    console.log('Cancelled duel: ', duel);
    if (duel && duel.isfinished) {
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
      await deleteDuel(duel.duel_id);
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
  inviter?: string,
) => {
  if (!query.message?.chat.id) {
    console.log('Chat not found');
    return;
  }

  const duel = await getDuelDataByUser(inviter?.toLowerCase() || '');

  if (!duel) {
    bot.sendMessage(query.message.chat.id, messages.duelNotFound);
    return;
  }
  const player = String(query?.message?.from?.id || '');

  /* if (!player) {
    bot.sendMessage(query.message.chat.id, messages.noUsername);
    return;
  } */

  await addDuelOpponent(duel.duel_id, player);
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

  const duelOpponent = ((await getOpponent(String(caller))) || inviter);
  const opponentData = await getPersonalDataById(Number(duelOpponent));
  const duelData = await getDuelDataByUser (String(caller));

  if (opponentData) {

      try {
        notifyDuelFinishFor(String(opponentData.id), duelData?.duel_id || "");
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

    const removeResult = await removeDuelOpponent(String(caller));

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
