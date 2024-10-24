import { runQuery, runQueryWithParams } from "../../models/connection";
import { isTournamentActive } from "./init";
import { createDuel } from "../../models/telegram";
import { dateSec } from "../../utils/text";

export interface TourPlayerData {
    chat_id: string;
    username: string;
    play: number;
    wins: number;
    id: number;
}

export async function isUserInTournament (userId: number, tourId: number) {
    const query = "SELECT COUNT(*) FROM tournament_participants WHERE user_id = $1 AND tournament_id = $2";
    const count = await runQueryWithParams(query, [userId, tourId]);
    return count && count.length > 0 && count[0].count > 0 ? true : false
}

export async function isUserInAnyActiveTourament (userId: number) {
    const now = dateSec();
    const query = `
    SELECT COUNT(*) 
    FROM tournament_participants 
    WHERE user_id = $1 AND tournament_id IN (
      SELECT id FROM tournaments WHERE date_start < $2 AND date_end > $2;
    );`;
    const result = await runQueryWithParams(query, [userId, now], true);
    return result && result.length > 0 ? result[0].count : 0
}

export async function takePartInTournament (userId: number, tourId: number) {
    if (await isUserInTournament(userId, tourId)) {
        return({
            success: false,
            error: "User already registered"
        })
    }
    const query = `INSERT INTO tournament_participants (user_id, tournament_id, duel_count) VALUES
    ($1 , $2, 0);`;
    return({
        success: (await runQueryWithParams(query, [userId, tourId])) ? true : false
    })
}

export async function getParticipantsIds (tourId: number): Promise<string[]> {

    const query = `SELECT 
    t.chat_id, p.user_id FROM telegram_personal as t, tournament_participants as p 
    WHERE t.user_id = p.user_id AND p.tournament_id = $1;`;
    const result = await runQueryWithParams(query, [tourId], true);
    return !result ? [] : result.map(p => p.chat_id)
}

export async function getParticipantsData (tourId: number, duelFree = false): Promise<TourPlayerData[]> {
    const query = `
    SELECT 
      t.chat_id, 
      p.user_id, 
      u.username,
      p.duel_count,
      COALESCE(duel_wins.wins_count, 0) AS duel_wins
    FROM 
      telegram_personal AS t
    JOIN 
      tournament_participants AS p ON t.user_id = p.user_id
    JOIN 
      users AS u ON u.id = t.user_id
    LEFT JOIN (
    SELECT 
        winner_id, 
        COUNT(*) AS wins_count
    FROM 
        duels
    WHERE 
        winner_id IN (
            SELECT p.user_id 
            FROM tournament_participants AS p 
            WHERE p.tournament_id = $1
        )
    AND 
        id IN (SELECT duel_id FROM duel_in_tournament WHERE tournament_id = $1)
    ${duelFree ? `
    AND p.user_id NOT IN (SELECT user_1_id FROM duels WHERE is_finished = false)
    AND p.user_id NOT IN (SELECT user_2_id FROM duels WHERE is_finished = false)
        ` : ""}
    GROUP BY 
        winner_id
    ) AS duel_wins ON duel_wins.winner_id = p.user_id
    WHERE 
      p.tournament_id = $1
    ORDER BY duel_wins DESC;`;
    
    const result = await runQueryWithParams(query, [tourId], true);
    return result ? result.map((row) => {
        return {
            chat_id: row.chat_id,
            username: row.username,
            play: row.duel_count,
            wins: row.duel_wins,
            id: row.user_id
        }
    }): []
}

export async function createDuelInTournament (user1: number, user2: number, tourId: number) {
    const active = await isTournamentActive(tourId);
    if (!active) {
        return({
            success: false,
            error: "Tournament is not active"
        })
    }
    const duelId = await createDuel (user1, user2)
    if (!duelId) {
        return({
            success: false,
            error: "Duel creation failed"
        })
    }
    const tourDuelAdditionQuery = `INSERT INTO "duel_in_tournament" 
    (duel_id, tournament_id) VALUES ($1, $2);`;
    const note = await runQueryWithParams(tourDuelAdditionQuery, [duelId, tourId]);
    return({
        success: note ? true : false,
        duelId 
    })
}

export async function isDuelInTournament (duelId: number): Promise<number> {
    const checkQuery = `SELECT tournament_id FROM "duel_in_tournament" WHERE duel_id = ${duelId};`;
    const result = await runQuery(checkQuery, true);
    return result && result.length > 0 ? result[0].tournament_id : 0;
} 

export async function isDuelInActiveTournament (duelId: number): Promise<number> {
    const now = dateSec();
    const checkQuery = `SELECT tournament_id FROM "duel_in_tournament" 
    WHERE duel_id = $1 AND tournament_id IN 
    (SELECT id FROM tournaments WHERE date_end < $2);`;
    const result = await runQueryWithParams(checkQuery, [duelId, now], true);
    return result && result.length > 0 ? result[0].tournament_id : 0;
}

export async function updateParticipantDuelCount (duelId: number): Promise<boolean> {
    const query = `
    UPDATE tournament_participants SET duel_count = duel_count + 1
    WHERE tournament_id IN 
    (SELECT tournament_id FROM duel_in_tournament WHERE duel_id = $1)
    AND 
    (user_id IN 
    (SELECT user_1_id FROM duels WHERE id = $1)
    OR 
    user_id IN
    (SELECT user_2_id FROM duels WHERE id = $1));
    `
    const result = await runQueryWithParams(query, [duelId], false);
    return !!result;
}