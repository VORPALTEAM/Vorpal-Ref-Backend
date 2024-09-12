import { runQuery } from "../../models/connection";
import { getActiveTournament, getTournamentData } from "./init";
import { createDuel } from "../../models/telegram";

export async function isUserInActiveTournament (userId: number) {
    const aTour = await getActiveTournament();
    if (!aTour) return false;
    const tourDate = await getTournamentData(aTour.id);
    return tourDate && tourDate?.partisipants.indexOf(userId) > -1 ? true : false
}


export async function takePartInTournament (userId: number, tourId: number) {
    if (await isUserInActiveTournament(userId)) {
        return({
            success: false,
            error: "User already registered"
        })
    }
    const query = `INSERT INTO tournament_participants (user_id, tournament_id) VALUES
    (${userId} , ${tourId});`;
    return({
        success: (await runQuery(query)) ? true : false
    })
}

export async function getPArticipantsIds () {
    const active = await getActiveTournament();
    if (!active) return [];
    const query = `SELECT 
    t.chat_id, p.user_id FROM telegram_personal as t, tournament_participants as p 
    WHERE t.user_id = p.user_id AND p.tournament_id = ${active.id};`;
    const result = await runQuery(query, true);
    return !result ? [] : result.map(p => p.chat_id)
}

export async function createDuelInTournament (user1: number, user2: number) {
    const active = await getActiveTournament();
    if (!active) {
        return({
            success: false,
            error: "No active duel"
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
    (duel_id, tournament_id) VALUES (${duelId}, ${active.id});`;
    const note = await runQuery(tourDuelAdditionQuery);
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