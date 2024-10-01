import { runQueryWithParams } from "../../models/connection";

export interface TournamentChatData {
    tournament_id: number;
    chat_id: string;
    chat_name: string
}

export async function addChatForTournamentAnnounce (data: TournamentChatData) {
    const query = `INSERT INTO tournament_chats (
        tournament_id, telegram_chat_id, telegram_chat_name)
        VALUES ($1, $2, $3) 
        ON CONFLICT (tournament_id, telegram_chat_id) DO NOTHING;`
    const result = await runQueryWithParams(query, [
        data.tournament_id,
        data.chat_id,
        data.chat_name
    ]);
    return !!result;
}

export async function gedTournamentAnnounceChats (tournamentId: number): Promise<TournamentChatData[]> {
    const query = `
    SELECT 
    tournament_id, telegram_chat_id, telegram_chat_name 
    FROM tournament_chats
    WHERE tournament_id = $1;`;
    const result = await runQueryWithParams(query, [tournamentId]);
    return result || [];
}
