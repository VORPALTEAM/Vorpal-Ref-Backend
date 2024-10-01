import TelegramBot from "node-telegram-bot-api";
import { publisherBot } from "../initial";
import { adminCmdPreprocess } from "../functions";
import { getAdminSession } from "../session";
import { sendMessageWithSave } from "../../handlers/utils";
import { createTournament, getActiveTournaments } from "../../../models/tournament";
import { dateSecFormat } from "../../../utils/text";

export const newTournamentAction = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.tournamentEditStart();
    sendMessageWithSave(publisherBot, chat, 
        `All rigtht, a new tournament. \n
        Enter the title, description, date_start, date_end below \n
        Every item on the new row, date format: mm:dd:YYYY hh:mm`);
    session.setLastAction("tournament_entry");
}

export const listOfTournamentsAction = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    const tours = await getActiveTournaments();
    if (tours.length === 0) {
        sendMessageWithSave(publisherBot, chat, 
            "There are no active tournaments, enter /newtournament to create a new one");
        return;
    }
    for (let j = 0; j < tours.length; j++) {
        sendMessageWithSave(publisherBot, chat, 
            `id: ${tours[j].id || "not found"}
             ${tours[j].title || "No title"} \n
             ${tours[j].description || "No description"} \n
             Starts at: ${tours[j].date_start ? dateSecFormat(Number(tours[j].date_start)) : "not found"} \n
             Finish at: ${tours[j].date_end ? dateSecFormat(Number(tours[j].date_end)) : "not found"}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Add announce chats',
                                callback_data: `addAnnounce_${tours[j].id}`,
                            },
                            {
                                text: 'Manage members',
                                callback_data: `members_${tours[j].id}`,
                            }
                        ]
                    ]
                }
             });
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(true)
            }, 1101)
        })
    }
}

export const confirmTournamentAction = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    const tour = session.editableTournament
    if (!tour) {
        sendMessageWithSave(
            publisherBot, chat,
            "Please, enter the tournament data at first");
        return;
    }
    const newTournamentId = await createTournament(tour);
    sendMessageWithSave(publisherBot, chat, `
           Tournament is now open, id ${newTournamentId?.id}: \n
            Title: ${tour.title || "No title"} \n
            Description: ${tour.description || "No description"} \n
            Date start: ${tour.date_start} \n
            Date finish: ${tour.date_end} \n
        `);
    session.tournamentEditClose();
}

export const cancelTournamentAction = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.tournamentEditClose();
    sendMessageWithSave(publisherBot, chat, "Tournament creation cancelled");
}

export const announceTournamentAction = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    const session = getAdminSession(chat);
    session.setLastAction("tournament_id_to_send");
    sendMessageWithSave(publisherBot, chat, "Enter tournament id:");
}


export const addAnnounceChatAction = async (query: TelegramBot.CallbackQuery) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, query);
    if (!chat) return;
    if (!query.data) return;
    const session = getAdminSession(chat);    
    const tourId = Number(query.data.replace("addAnnounce_", ""));
    if (isNaN(tourId)) {
        sendMessageWithSave(publisherBot, chat, "Invalid tournament id");
        return;
    }
    session.tournamentId = tourId;
    session.setLastAction("tournament_chat_entry");
    sendMessageWithSave(publisherBot, chat, "Now enter chats, id name in each new row");
    return;    
}

export const manageMembersAction = async (query: TelegramBot.CallbackQuery) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, query);
    if (!chat) return;
    if (!query.data) return;
    const session = getAdminSession(chat);
    sendMessageWithSave(publisherBot, chat, "Participants:");
    session.setLastAction("TOUR_MEMBERS_MANAGE");
    
}