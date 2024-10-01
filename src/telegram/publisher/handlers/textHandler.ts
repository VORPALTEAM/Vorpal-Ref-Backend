import TelegramBot from "node-telegram-bot-api";
import { notABusyRegex } from "../../../utils/text";
import { sendMessageWithSave } from "../../handlers/utils";
import { adminCmdPreprocess } from "../functions";
import { publisherBot } from "../initial";
import { getAdminSession } from "../session";
import { commands } from "../types";


export const textHandler = async (msg: TelegramBot.Message) => {
    if (!publisherBot) return;
    const chat = await adminCmdPreprocess(publisherBot, msg);
    if (!chat) return;
    if (!msg.text || !notABusyRegex(msg.text, commands)) {
       return;
    }
    const session = getAdminSession(chat);
    const action = session.getLastAction();
    if (action === "tournament_entry") {
        const data = msg.text.split(`\n`);
        if (data.length !== 4) {
            sendMessageWithSave(publisherBot, chat, "Invalid number of data");
            return;
        }
        try {
           const date = new Date(data[2]).getTime();
           const date2 = new Date(data[3]).getTime();
        } catch (e) {
            sendMessageWithSave(publisherBot, chat, "Invalid date format");
            return;
        }
        
        session.tournamentEditUpdate("title", data[0]);
        session.tournamentEditUpdate("description", data[1]);
        session.tournamentEditUpdate("date_start", new Date(data[2]).getTime());
        session.tournamentEditUpdate("date_end", new Date(data[3]).getTime());
        sendMessageWithSave(publisherBot, chat, `
            Tournament data is now written: \n
            Title: ${data[0]} \n
            Description: ${data[1]} \n
            Date start: ${data[2]} \n
            Date finish: ${data[3]} \n
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