import { runQueryWithParams } from '../connection';

export interface DuelTournamentNote {
   id: number;
   user1: string;
   user2: string;
   winner: string;
}

export async function addTournamentAdmin(tourId: number, adminId: number) {
  const query = `
   INSERT INTO tournament_admins (tournament_id, admin_id)
	VALUES ($1, $2) 
    ON CONFLICT (tournament_id, admin_id) 
    DO NOTHING;`;
  const result = await runQueryWithParams(query, [tourId, adminId], false);
  return !!result;
}

export async function getTournamentAdmins(tourId: number): Promise<number[]> {
  const query = `
   SELECT tournament_id, admin_id FROM tournament_admins
   WHERE tournament_id = $1;
   `;
  const result = await runQueryWithParams(query, [tourId], true);
  return result ? result.map((item) => item.admin_id) : [];
}

export async function isTournamentAdmin(
  tourId: number,
  userId: number,
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) FROM tournament_admins
    WHERE tournament_id = $1
    AND admin_id = $2;
    `;
  const result = await runQueryWithParams(query, [tourId, userId], true);
  return result && result.length > 0 ? result[0].count > 0 : false;
}

export async function getTournamentDuels (tourId: number): Promise<DuelTournamentNote[]> {
  const query = `
  SELECT 
    duels.id,
    t1.chat_id AS user_1_chat_id,
    t2.chat_id AS user_2_chat_id,
    t3.chat_id AS winner_chat_id
  FROM 
    duels
  JOIN 
    telegram_personal AS t1 ON t1.user_id = duels.user_1_id
  JOIN 
    telegram_personal AS t2 ON t2.user_id = duels.user_2_id
  JOIN 
    telegram_personal AS t3 ON t3.user_id = duels.winner_id
  WHERE 
    duels.id IN (SELECT duel_id FROM duel_in_tournament WHERE tournament_id = $1);
  `;
  const result = await runQueryWithParams(query, [tourId], true);
  return result ? result.map((row) => {
    return {
      id: row.id,
      user1: row.user_1_chat_id,
      user2: row.user_2_chat_id,
      winner: row.winner_chat_id
    }
  }): []
}

export async function getUserTournamentWinsCount (userId: number, tourId: number): Promise<number> {
    const query = `
     SELECT COUNT(*) FROM duels 
     WHERE winner_id = $1
     AND id IN 
     (SELECT duel_id FROM duel_in_tournament WHERE tournament_id = $2);
    `;
    const result = await runQueryWithParams(query, [userId, tourId], true);
    return result && result.length > 0 ? result[0].count : 0;
}
