import { runQuery } from "../../models/connection";

export interface DailyReward {
    id: number;
    user_id: number;
    last_received?: number;
}

export async function addDailyRewardNote (userId: number): Promise<number> {
   const dateSec = Math.round(new Date().getTime() / 1000);
   const query = `
   INSERT INTO "daily_rewards" (user_id, last_received)
   VALUES (${userId}, ${dateSec}) ON CONFLICT (user_id) DO
   UPDATE "daily_rewards" SET last_received = ${dateSec} WHERE
   user_id = ${userId} RETURNING last_received;`;
   const result = await runQuery(query, true);
   return result && result.length > 0 ? result[0].last_received || 0 : 0
}

export async function getUserLastRewardDate (userId: number): Promise<number> {
    const query = `SELECT last_received FROM "daily_rewards" WHERE user_id = ${userId};`;
    const result = await runQuery(query, true);
    return result && result.length > 0 ? result[0].last_received || 0 : 0;
}