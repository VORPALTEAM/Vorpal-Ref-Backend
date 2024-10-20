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
import { getDuelUsers } from '../../../models/telegram';
import { getWinners, setWinner } from '../../../models/tournament/winners';

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
                  text: 'Get members',
                  callback_data: `members_${tours[j].id}`
                },
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
// getWinners_
export const getWinnersAction  = async (query: TelegramBot.CallbackQuery) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, query);
  if (!chat) return;
  if (!query.data) return;
  const session = getAdminSession(chat);  
  const tourId = Number(query.data.replace('getWinners_', ''));
  session.tournamentId = tourId;
  if (isNaN(tourId)) {
    sendMessageWithSave(publisherBot, chat, 'Invalid tournament id');
    return;
  }  
  const winners = await getWinners(tourId);
  sendMessageWithSave(publisherBot, chat,  winners.length === 0 ?
    "Winners is not setup" :`
         Winners:
         ${winners.map((row) => `${row.user_id}, place: ${row.place}`)}
    `)
}
// setWinners_
export const setWinnersAction  = async (query: TelegramBot.CallbackQuery) => {
  if (!publisherBot) return;  
  const chat = await adminCmdPreprocess(publisherBot, query);
  if (!chat) return;
  if (!query.data) return;
  const session = getAdminSession(chat);  
  const tourId = Number(query.data.replace('setWinners_', ''));
  if (isNaN(tourId)) {
    sendMessageWithSave(publisherBot, chat, 'Invalid tournament id');
    return;
  }  
  session.setLastAction("winner_setup");
  sendMessageWithSave(publisherBot, chat, `
       Now enter the winner rows Id place format
    `)
}

async function notifyWinner (winnerTelegramId: number, username: string, place: number) {
   const messageText = `
        Congradulations! ${username}, you have reached ${place} place in our last
        tournament! Ask @ivemaker to get your prize!
   `
   sendMessageWithSave(Bot, winnerTelegramId, messageText);
}

export const setWinnersTextFilter = async (text: string, chat: number) => {
  if (!publisherBot) return;
  const session = getAdminSession(chat);  
  if (!session.tournamentId) {
    sendMessageWithSave(publisherBot, chat, "No tournament id");
    return;   
  }
  text.split(`\n`).map(async (row) => {
    if (!publisherBot) return;
    const werbs = row.split(" ");
    if (werbs.length !== 2) {
      sendMessageWithSave(publisherBot, chat, "Invalid row");
      return;
    }
    if (isNaN(Number(werbs[0])) || isNaN(Number(werbs[1]))) {
      sendMessageWithSave(publisherBot, chat, "Invalid params");
      return;     
    }
    const userData = await getUserData(werbs[0]);
    if (!userData) {
      sendMessageWithSave(publisherBot, chat, "User not found");
      return;     
    }
    setWinner({
           tournament_id: session.tournamentId,
           user_id: userData.id,
           place: Number(werbs[1])
    });
    notifyWinner(Number(werbs[0]), userData.username, Number(werbs[1]));
    sendMessageWithSave(publisherBot, chat, "Winner is setup successful!");   
  });

  // setWinner()
}