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