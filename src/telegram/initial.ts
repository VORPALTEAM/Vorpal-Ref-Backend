import TelegramBot from 'node-telegram-bot-api';
import { txnHistoryAction, duelAcceptAction, duelCancelAction, duelRefuseAction } from './handlers/duel';
import { startHandler } from './handlers/start';
import { duelText, messages, startText, tg_token, usingRegExps } from './constants';
import { Bot } from './bot';
import { duelCreationHandler } from './handlers/duelCreate';
import { duelAcceptHandler } from './handlers/duelAccept';
import { sendMessageWithSave } from './handlers/utils';
import { MarkupKeyboard } from './handlers/keyboard';
import { notABusyRegex } from '../utils/text';
import { referralLastTxnAction, referralStatsAction, referralStatsHandler, referralTotalCountAction } from './handlers/referral';
import { SetupBotMenuCommands } from './cmdSetup';
import { getPersonalDataById, getPersonalDataByUsername } from '../models/telegram';
import { initOldBot } from './old';
import { dailyRewardHandler } from './handlers/dailyReward';


export function telegramBotLaunch() {

  SetupBotMenuCommands ();

  Bot.onText(/\/start/, async (msg, match) => {
    const startDuelRegex = /\/start (.+)/;
    if (msg.text && startDuelRegex.test(msg.text)) {
        return;
    }

    await startHandler(Bot, msg, match);
  });

  Bot.onText(/\/duel/, async (msg, match) => {

    await duelCreationHandler (Bot, msg);
  });

  Bot.onText(/\/referral/, async (msg, match) => {

    await referralStatsHandler (Bot, msg);
  });

  Bot.onText(/\/reward/, async (msg, match) => {

    await dailyRewardHandler (Bot, msg);
  });

  Bot.onText(/\/start(.+)/, async (msg, match) => {

    console.log("Match entry: ", match, match? match[1] : "not found")

    await startHandler(Bot, msg, match);

    // await  duelAcceptHandler(Bot, msg, match);
  });

  Bot.onText(/\/start(?:\?startapp=([^]+))?/, async (msg, match) => {
    const inviterLogin = match ? match[1] : "" // Если inviterId присутствует в ссылке, он будет доступен здесь
    if (inviterLogin) {
        Bot.sendMessage(msg.chat.id, `You have invited by: ${inviterLogin}`);
    } 
  });

  Bot.on('inline_query', async (query) => {
    const deepLink = `https://t.me/${
      process.env.TELEGRAM_BOT_NAME
    }?start=${query.from.username?.replace(' ', '')}`;

    const startappLink = `https://t.me/${process.env.TELEGRAM_BOT_NAME}/vtester?startapp=inviterId_${String(query.from.id)}`;

    const results: TelegramBot.InlineQueryResult[] = [
      {
        type: 'article',
        id: '1',
        title: 'Send invitation message',
        input_message_content: {
          message_text: `Duel call from ${query.from.first_name} ${
            query.from.last_name || ''
          }`,
          parse_mode: 'Markdown',
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Confirm invitation', url: startappLink }], //callback_data: metadataString
          ],
        },
      },
    ];

    await Bot.answerInlineQuery(query.id, results);
    return;
  });

  Bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
    if (!query.data) return; 
    const inviter = query.data.split("%")[1] || ""
    switch (true) {
      case query.data === "duel":
        await duelCreationHandler (Bot, query);
        break;
      case query.data === "transactions":
        await txnHistoryAction (Bot, query);
        break;
      case query.data === "referrals":
        await referralStatsAction (Bot, query)
        break;
      case query.data.indexOf("duelconfirm") > -1:
        await duelAcceptAction (Bot, query, inviter);
        break;
      case query.data.indexOf("duelrefuse") > -1:
        await duelRefuseAction (Bot, query, inviter);
        break;
      case query.data.indexOf("totalRef") >-1:
        await referralTotalCountAction(Bot, query);
        break;
      case query.data.indexOf("refTxnList") >-1:
          await referralLastTxnAction(Bot, query);
          break;
      case  query.data.indexOf("duelcancel") > -1:
        await duelCancelAction (Bot, query,  inviter);
        break;
    }
  });

  Bot.on('message', async (msg, match) => {
    const txt: string = msg.text || "";
    switch (true) {
      case txt === "Start": 
        await startHandler (Bot, msg, match)
        break;
      case txt === "Duel": 
        await duelCreationHandler (Bot, msg)
        break;
      case txt === "start": 
        await startHandler (Bot, msg, match)
        break;
      case txt.length < 3:
        await startHandler (Bot, msg, match)
        break;
      case notABusyRegex (txt, usingRegExps):
        await startHandler (Bot, msg, match)
        break;
    }
  });

  Bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  Bot.on('webhook_error', (error) => {
    console.error('Webhook error:', error);
  });

  Bot.on('error', (error) => {
    console.error('Bot error:', error);
  });
}

initOldBot ();
