import { dateSec } from 'utils/text';
import { runQuery } from '../../models/connection';

export interface tournament {
  id: number;
  date_start: number;
  date_end: number;
  partisipants: number[];
}

export async function getLastTournament(): Promise<tournament | null> {
  const query = `SELECT id, date_start FROM tournaments ORDER BY date_start DESC LIMIT 1;`;
  const result = await runQuery(query, true);
  return result && result.length > 0 ? result[0] : null;
}

export async function getTournamentData(
  id: number,
): Promise<tournament | null> {
  const query = `SELECT id, date_start, date_end FROM tournaments WHERE id = ${id};`;
  const result = await runQuery(query, true);
  if (!result || result.length === 0) {
    return null;
  }
  const partsQuery = `SELECT user_id FROM tournament_participants WHERE tournament_id = ${id}`;
  const parts = await runQuery(partsQuery, true);
  return {
    id: result[0].id,
    date_start: result[0].date_start,
    date_end: result[0].date_end,
    partisipants: !parts ? [] : parts.map((p) => p.user_id),
  };
}

export async function getActiveTournament(): Promise<tournament | null> {
  const now = dateSec();
  const query = `SELECT id, date_start, date_end FROM tournaments WHERE date_start <= ${now} AND date_end >= ${now}`;
  const result = await runQuery(query, true);
  return result && result.length > 0 ? result[0] : null;
}

export async function createTournament(
  dailyDuration = 1,
): Promise<{ success: boolean; error?: string }> {
  const activeTournament = await getActiveTournament();
  if (activeTournament) {
    return {
      success: false,
      error: 'Another tournament is currently active',
    };
  }

  const now = dateSec();
  const newTournamentQuery = `INSERT INTO tournaments (date_start, date_end) VALUES (${now}, ${
    now + 86400 * dailyDuration
  })`;
  await runQuery(newTournamentQuery);

  return {
    success: true,
  };
}
