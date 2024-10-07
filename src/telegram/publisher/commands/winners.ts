import TelegramBot from 'node-telegram-bot-api';
import { publisherBot } from '../initial';
import { adminCmdPreprocess } from '../functions';
import { getAdminSession } from '../session';
import { sendMessageWithSave } from '../../handlers/utils';
import {
  addTournamentAdmin,
  createDuelInTournament,
  createTournament,
  getActiveTournaments,
  getFinishedTournaments,
  getParticipantsData,
  getParticipantsIds,
  getTournamentAdmins,
  getTournamentAnnounceChats,
  getTournamentDuels,
} from '../../../models/tournament';
import { dateSec, dateSecFormat, formatTime } from '../../../utils/text';
import {
  getUserById,
  getUserData,
  getUserTelegramChat,
} from '../../../models/user';
import { Bot } from '../../bot';
import { basicStartappLink } from '../../constants';
import { getUserInviterByTelegramId } from 'models/telegram/referral';
import { getDuelUsers } from '../../../models/telegram';

export const listOfFinishedTours = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    const tours = await getFinishedTournaments();
    if (tours.length === 0) {
      sendMessageWithSave(
        publisherBot,
        chat,
        'There are no finished tournaments, enter /newtournament to create a new one',
      );
      return;
    }  
    const now = dateSec();
    for (let j = 0; j < tours.length; j++) {
      sendMessageWithSave(
        publisherBot,
        chat,
        `id: ${tours[j].id || 'not found'}
               ${tours[j].title || 'No title'} \n
               ${tours[j].description || 'No description'} \n
               Starts at: ${
                 tours[j].date_start
                   ? dateSecFormat(Number(tours[j].date_start))
                   : 'not found'
               } \n 
               Finish at: ${
                 tours[j].date_end
                   ? dateSecFormat(Number(tours[j].date_end))
                   : 'not found'
               } \n`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Get winners',
                  callback_data: `getWinners_${tours[j].id}`,
                },
                {
                    text: 'Set winners',
                    callback_data: `setWinners_${tours[j].id}`,
                  }
              ],
            ],
          },
        },
      );
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1101);
      });
    }      
}