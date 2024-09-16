import TelegramBot from 'node-telegram-bot-api';
import { duel_lifetime } from '../../config';
import { duelText, inviteLink, messages, startText } from '../constants';
import { InlineKeyboard } from './keyboard';
import { sendMessageWithSave } from './utils';
import { getReferralCount, getReferralStatsByUserTelegramId, getReferralTotalRewardsByUser } from '../../models/telegram/referral';
import { Bot } from '../bot';
import { createUserIfNotExists } from '../../models/user';

export const referralStatsAction = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
    console.log("History requested")
    if (!query.message) return;

    /* const transactions = await GetReferralStatsByUser (query.from.username);
    if (transactions.length === 0) {
        SendMessageWithSave (Bot, query.message.chat.id, "No referral rewards yet");
        return;
    } */

    /*
    const historyText = `<b>Your rewards from referrals:</b>\n ${transactions.map((txn) => {
        return `LeveL: ${txn.level}, for: ${txn.for}, resource: ${txn.resource}, amount: ${txn.amount}\n`
   })}` */
    const user = await createUserIfNotExists("user", undefined, undefined, query.from);
    const refCounts = await getReferralCount(user);
    const historyText = `
       <b>Level1: ${refCounts.level1}</b>
       <b>Level2: ${refCounts.level2}</b>
    `

    sendMessageWithSave (Bot, query.message.chat.id, historyText,
     {
       parse_mode: "HTML",
       reply_markup: InlineKeyboard(['referralTotalRewards', 'referralRewardList']),
     });
    return;
}


export const referralTotalCountAction = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  if (!query.message) return;
  const counts = await getReferralTotalRewardsByUser(String(query.from.id));
  const historyText = counts.length > 0 ? `<b>Your total rewards for referrals:</b>\n ${counts.map((item) => {
    return `Resource: ${item.item === 'token' ? 'tVRP' : item.item}: +${item.amount}\n`
  })}` : `Still no rewards`
  sendMessageWithSave (Bot, query.message.chat.id, historyText,
    {
      parse_mode: "HTML",
    });
}

export const referralLastTxnAction = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  if (!query.message) return;
  const transactions = await getReferralStatsByUserTelegramId (String(query.from.id));
    if (transactions.length === 0) {
        sendMessageWithSave (Bot, query.message.chat.id, "No referral rewards yet");
        return;
    }
    const historyText = `<b>Last receipts from your referrals:</b>\n ${transactions.map((txn) => {
      return `Level: ${txn.level}, ${txn.resource === 'token' ? 'tVRP' : txn.resource}, ${txn.amount}\n`
    })}`
    sendMessageWithSave (Bot, query.message.chat.id, historyText,
    {
      parse_mode: "HTML",
    });
}

export const referralStatsHandler = async (bot: TelegramBot, query: TelegramBot.Message) => {

  if (!query?.from) return;
  /* if (!query?.from.username){
   SendMessageWithSave (Bot, query.chat.id, messages.noUsername);
   return;
  } */
  const user = await createUserIfNotExists("user", undefined, undefined, query.from);
  const refCounts = await getReferralCount(user);
  const historyText = `
     <b>Level1: ${refCounts.level1}</b>
     <b>Level2: ${refCounts.level2}</b>
  `

  sendMessageWithSave (Bot, query.chat.id, historyText,
   {
     parse_mode: "HTML",
     reply_markup: InlineKeyboard(['referralTotalRewards', 'referralRewardList'])
   });
  return;
}