import TelegramBot from 'node-telegram-bot-api';
import {
  addAnnounceChatAction,
  getWinnersAction,
  manageDuelsAction,
  manageMembersAction,
  setWinnersAction,
} from '../commands';

export const callbackHandler = async (query: TelegramBot.CallbackQuery) => {
  if (!query.data) return;
  switch (true) {
    case query.data.indexOf('addAnnounce_') > -1:
      addAnnounceChatAction(query);
      break;
    case query.data.indexOf('members_') > -1:
      manageMembersAction(query);
      break;
    case query.data.indexOf('duels_') > -1:
      manageDuelsAction(query);
      break;
    case query.data.indexOf('getWinners_') > -1:
      getWinnersAction(query);
      break;
    case query.data.indexOf('setWinners_') > -1:
      setWinnersAction(query);
      break;
  }
};
