import { getUserTransactions } from "../models/telegram";
import { createNewBox, openBox } from "../models/rewards/updaters";
import { TelegramAuthData } from "types";

async function boxCreateOpenTest () {

    const testUser: TelegramAuthData = {
        id:99999099999,
        first_name: 'test',
        last_name: 't',
        username: 'tester',
        hash: 'a4a4a4',
        auth_date: 1900000000
    }

    const box = await createNewBox(1, String(testUser.id), String(testUser.id));
    console.log("Created: ", box);
    if (box.max) {
        await openBox (box.max, testUser);
        const txns = await getUserTransactions(String(testUser.id) || "");
        console.log("History: ", txns);
    }
}

boxCreateOpenTest ()