import { getUserTransactions } from "../models/telegram";
import { createNewBox, openBox } from "../models/rewards/updaters";
import { TelegramAuthData } from "types";
import { createUserIfNotExists } from "../models/user";

async function boxCreateOpenTest () {

    const testUser: TelegramAuthData = {
        id:99999099999,
        first_name: 'test',
        last_name: 't',
        username: 'tester',
        hash: 'a4a4a4',
        auth_date: 1900000000
    }
    const testUserId = await createUserIfNotExists("user", undefined, undefined, testUser);
    const box = await createNewBox(1, testUserId);
    if (box) {
        await openBox (box, testUser);
        const txns = await getUserTransactions(String(testUser.id) || "");
    }
}

boxCreateOpenTest ()