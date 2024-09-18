import { geFinishedDuelsCount, getReferralStats, getTotalUsers } from "../../models/stats";
import TelegramBot from "node-telegram-bot-api";
import * as CSV from 'csv-writer'
import fs from 'fs';

const csvFilePath = './data.csv';

export async function downloadReferralStats (bot: TelegramBot, msg: TelegramBot.Message) {
    const chat = msg.from?.id;
    if (!chat) return;
    const stats = await getReferralStats();
    const totalUsers = await getTotalUsers();
    const finishedDuels = await geFinishedDuelsCount ();
    
    const csvWriter = CSV.createArrayCsvWriter({
        path: csvFilePath,
        header: ['inviter_id', 'user_count']
    });

    await csvWriter.writeRecords(stats.map((row) => {
        return [row.inviter_id, row.user_count]
    }));
    await csvWriter.writeRecords([
       [ "Total users: ", totalUsers],
       [ "Total duels finished: ", finishedDuels],
    ])

    const fileStream = fs.createReadStream(csvFilePath)

    bot.sendDocument(chat, fileStream);
}