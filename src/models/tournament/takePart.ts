import { runQuery, runQueryWithParams } from "../../models/connection";
import { isTournamentActive } from "./init";
import { createDuel } from "../../models/telegram";

export async function isUserInTournament (userId: number, tourId: number) {
    const query = "SELECT COUNT(*) FROM tournament_participants WHERE user_id = $1 AND tournament_id = $2";
    const count = await runQueryWithParams(query, [userId, tourId]);
    return count && count.length > 0 && count[0].count > 0 ? true : false
}


export async function takePartInTournament (userId: number, tourId: number) {
    if (await isUserInTournament(userId, tourId)) {
        return({
            success: false,
            error: "User already registered"
        })
    }
    const query = `INSERT INTO tournament_participants (user_id, tournament_id) VALUES
    ($1 , $2);`;
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

export async function createDuelInTournament (user1: number, user2: number, tourId: number) {
    const active = await isTournamentActive(tourId);
    if (!active) {
        return({
            success: false,
            error: "Duel is not active"
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

export async function isDuelInTournament (duelId: number): Promise<boolean> {
    const checkQuery = `SELECT count(*) FROM "duel_in_tournament" WHERE duel_id = ${duelId};`;
    const result = await runQuery(checkQuery, true);
    return result && result[0]?.count > 0 ? true : false;
} 