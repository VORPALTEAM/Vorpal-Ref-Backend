import { dateSec } from "../../utils/text";
import { runQuery } from "../../models/connection"

export async function getReferralStats (): Promise<{inviter_id: number, user_count: number}[]> {
    const query = `
    SELECT inviter_id, COUNT(*) AS user_count
    FROM users
    WHERE inviter_id IS NOT NULL
    GROUP BY inviter_id;`
    const result = await runQuery(query, true);
    return result || []
}

export async function getFinishedDuelsCount (): Promise<number> {
    const query = `SELECT count(*) FROM duels WHERE user_2_id IS NOT NULL;`;
    const result = await runQuery(query, true);
    return result && result.length > 0 ? result[0].count : 0
}

export async function getAllDuelsCount (): Promise<number> {
    const query = `SELECT count(*) FROM duels;`;
    const result = await runQuery(query, true);
    return result && result.length > 0 ? result[0].count : 0
}

export async function getDuelsCountLastDate (): Promise<number> {
    const date = dateSec() - 86400;
    const query = `SELECT count(*) FROM duels WHERE creation >= ${date};`;
    const result = await runQuery(query, true);
    return result && result.length > 0 ? result[0].count : NaN
}

export async function getDailyRewardReceiversCount (): Promise<number> {
    const date = dateSec() - 86400;
    const query = `SELECT count(*) FROM daily_rewards WHERE last_received >= ${date};`;
    const result = await runQuery(query, true);
    return result && result.length > 0 ? result[0].count : NaN
}


export async function getTotalUsers (): Promise<number> {
   const query = `SELECT count(*) FROM "users";`;
   const result = await runQuery(query, true);
   return result && result.length > 0 ? result[0].count : 0
}