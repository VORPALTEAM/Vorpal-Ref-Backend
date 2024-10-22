import TelegramBot from "node-telegram-bot-api";
import { notABusyRegex } from "../../../utils/text";
import { sendMessageWithSave } from "../../handlers/utils";
import { adminCmdPreprocess } from "../functions";
import { publisherBot } from "../initial";
import { getAdminSession } from "../session";
import { commands } from "../types";
import { addChatForTournamentAnnounce } from "../../../models/tournament";
import { createTournamentDuel, prolongTournament, setWinnersTextFilter } from "../commands";
import { getUserByTeleramUsername } from "../../../models/user";
import { getUserReferralLink } from "../../../models/telegram/referral";
import { inviteLink } from "../../constants";


export const textHandler = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    if (!msg.text || !notABusyRegex(msg.text, commands)) {
       return;
    }
    const session = getAdminSession(chat);
    const action = session.getLastAction();
    if (msg.text.indexOf(" ") > 0) {
        const werbs = msg.text.split(" ");
        if (werbs[0] === "refCmd" && werbs.length > 1) {
            const userUsername = werbs[1].toLowerCase();
            const userId = await getUserByTeleramUsername(userUsername);
            if (!userId) {
                sendMessageWithSave(publisherBot, chat, "User not found");
                return;
            }
            const link = await getUserReferralLink(userId);
            sendMessageWithSave(publisherBot, chat, `
                User link: \n
                ${link}
                ${inviteLink}${link}
                `);
                return;
        }
    }
    if (action === "winner_setup") {
        setWinnersTextFilter(msg.text || "", chat)
        return;
    }
    if (action === "TOUR_MEMBERS_MANAGE") {
        createTournamentDuel(msg);
        return;
    }
    if (action === "tournament_id_to_send") {
        const tourId = Number(msg.text.split(" ")[0]);
        if (isNaN(tourId)) {
            sendMessageWithSave(publisherBot, chat, "Invalid id, try again");
            return;
        }
        session.tournamentId = tourId;
        session.setLastAction("tournament_announce_entry");
        sendMessageWithSave(publisherBot, chat, "Now enter the post with photo or another media");
        return;
    }
    if (action === "prolong_tournament") {
        prolongTournament(msg);
        return;
    }
    if (action === "tournament_chat_entry") {
        const chats: string[][] = msg.text?.split(`\n`).map((item) => {
            return item.split(" ")
        });
        if (!chats) {
            sendMessageWithSave(publisherBot, chat, "No chats present");
            return;
        }
        chats.forEach((row) => {
            if (row.length === 2) {
                const id = row[0];
                const name = row[1];
                if (!isNaN(Number(id))) {
                    addChatForTournamentAnnounce({
                        tournament_id: session.tournamentId,
                        chat_id: id,
                        chat_name: name
                    })
                }
            }
        })
        sendMessageWithSave(publisherBot, chat, 
            "Announce chats updated, say /announcetournament to send announce");
        return;
    }
    if (action === "tournament_entry") {
        const data = msg.text.split(`\n`);
        let dateAnnounce: number;
        let dateStart: number;
        let dateEnd: number;
        if (data.length !== 5) {
            sendMessageWithSave(publisherBot, chat, "Invalid number of data");
            return;
        }
        try {
            dateAnnounce = Math.round(new Date(data[2]).getTime() / 1000);
            dateStart = Math.round(new Date(data[3]).getTime() / 1000);
            dateEnd = Math.round(new Date(data[4]).getTime() / 1000);
        } catch (e) {
            sendMessageWithSave(publisherBot, chat, "Invalid date format");
            return;
        }

        session.tournamentEditUpdate("title", data[0]);
        session.tournamentEditUpdate("description", data[1]);
        session.tournamentEditUpdate("date_announce", dateAnnounce);
        session.tournamentEditUpdate("date_start", dateStart);
        session.tournamentEditUpdate("date_end", dateEnd);
        sendMessageWithSave(publisherBot, chat, `
            Tournament data is now written: \n
            Title: ${data[0]} \n
            Description: ${data[1]} \n
            Date register: ${data[2]} \n
            Date start: ${data[3]} \n
            Date finish: ${data[4]} \n
            Ender /confirmtournament to start or /canceltournament to return
            `);
        return;
    }
   
    if (action === "init_post") {
        if (!publisherBot) return;
        session.textPost = msg.text;
        console.log("Text: ", session.textPost);  
        sendMessageWithSave(publisherBot, chat, `Look at your post and send it if ok: `);
        setTimeout(() => {
            if (!publisherBot) return;
            sendMessageWithSave(publisherBot, chat, msg.text || "", {
                parse_mode: "HTML"
            });
        }, 1101);
        session.setLastAction("post_written");
        return;
    }
    if (action === "enter_keyboard") {
        const chat = await adminCmdPreprocess(publisherBot, msg);
        if (!chat) return;
        const keyboardInfo = msg?.text.split(" ");
        if (!keyboardInfo || keyboardInfo.length < 2) {
            sendMessageWithSave(publisherBot, chat, `Invalid entry`);
            return;
        }
        session.postKeyboard = [
            [
                {
                    text: keyboardInfo[0], 
                    url: keyboardInfo[1]
                }
            ]
        ]
        sendMessageWithSave(publisherBot, chat, `Your button under post:`, {
            reply_markup: {
                inline_keyboard: session.postKeyboard
            }
        });
        return;
    }
    session.setLastAction("post_written");
  }