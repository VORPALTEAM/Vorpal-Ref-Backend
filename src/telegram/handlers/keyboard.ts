import { Markup } from 'telegraf';
import {
  basicStartappLink,
  communityTgUrl,
  duelConfirmText,
  duelRefuseText,
  duelText,
  enterGameText,
  enterGameTextReward,
  inviteLink,
  joinText,
  messages,
  referralText,
  startText,
} from '../constants';

export const MarkupKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [[{ text: 'Start' }], [{ text: 'Duel' }]],
      resize_keyboard: true,
    },
  };
};

export const InlineKeyboard = (actions: string[], inviter?: string) => {
  const keyboard: any[][] = [];
  let row: any[] = [];

  actions.forEach((a) => {
    switch (true) {
      case a === 'duel':
        row.push({
          text: duelText,
          callback_data: `duel`,
        });
        break;
      case a.indexOf('enterGame') > -1:
        row.push({
          text: enterGameText,
          url: basicStartappLink,
        });
        break;
      case a.indexOf('GameToReward') > -1:
        row.push({
          text: enterGameTextReward,
          url: basicStartappLink,
        });
        break;
      case a.indexOf('joinCommunity') > -1:
        row.push({
          text: joinText,
          url: communityTgUrl,
        });
        break;
      case a.indexOf('duelConfirm') > -1:
        row.push({
          text: duelConfirmText,
          web_app: { url: `${process.env.TELEGRAM_CLIENT_URL}` },
        });
        break;
      case a.indexOf('duelRefuse') > -1:
        row.push({
          text: duelRefuseText,
          callback_data: `${a.toLowerCase()}%${inviter || ''}`,
        });
        break;
      case a.indexOf('dailyReward') > -1:
        row.push({
          text: 'Daily reward',
          callback_data: 'dailyReward',
        });
        break;
      case a.indexOf('duelCancel') > -1:
        row.push({
          text: 'Cancel a duel',
          callback_data: `${a.toLowerCase()}%${inviter || ''}`,
        });
        break;
      case a.indexOf('referralTotalRewards') > -1:
        row.push({
          text: 'Total rewards',
          callback_data: `${a.toLowerCase()}%totalRef`,
        });
        break;
      case a.indexOf('referralRewardList') > -1:
        row.push({
          text: 'Last transactions',
          callback_data: `${a.toLowerCase()}%refTxnList`,
        });
        break;
      case a === 'transactions':
        row.push({
          text: 'Watch transactions',
          callback_data: `transactions`,
        });
        break;
      case a === 'referrals':
        row.push({
          text: referralText,
          callback_data: `referrals`,
        });
        break;
      default:
        row.push({
          text: 'Press action',
          callback_data: `${a.toLowerCase()}`,
        });
        break;
    }

    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });

  if (row.length > 0) {
    keyboard.push(row);
  }

  return { inline_keyboard: keyboard };
};
