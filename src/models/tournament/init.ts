import { dateSec } from '../../utils/text';
import { runQuery, runQueryWithParams } from '../../models/connection';

export interface Tournament {
  id?: number;
  date_start?: number;
  date_end?: number;
  title?: string;
  description?: string;
  partisipants?: number[];
}

export async function getLastTournament(): Promise<Tournament | null> {
  const query = `SELECT id, date_start FROM tournaments ORDER BY date_start DESC LIMIT 1;`;
  const result = await runQuery(query, true);
  return result && result.length > 0 ? result[0] : null;
}

export async function getTournamentData(
  id: number,
): Promise<Tournament | null> {
  const query = `SELECT id, date_start, date_end, title, description FROM tournaments WHERE id = $1;`;
  const result = await runQueryWithParams(query, [id], true);
  if (!result || result.length === 0) {
    return null;
  }
  const partsQuery = `SELECT user_id FROM tournament_participants WHERE tournament_id = $1`;
  const parts = await runQueryWithParams(partsQuery, [id], true);
  return {
    id: result[0].id,
    date_start: result[0].date_start,
    date_end: result[0].date_end,
    partisipants: !parts ? [] : parts.map((p) => p.user_id),
  };
}

export async function isTournamentRegistrationAvailable (tourId: number): Promise<boolean> {
  const now = dateSec();
  const query = `SELECT date_start, date_end FROM tournaments WHERE id = $1`;
  const result = await runQueryWithParams(query, [tourId], true);
  if (!result || result.length === 0) {
    return false;
  }
  return result[0].date_start >= now
}

export async function isTournamentActive(tourId: number): Promise<boolean> {
  const now = dateSec();
  console.log("Tour id: ", tourId);
  const query = `SELECT date_start, date_end FROM tournaments WHERE tourId = $1`;
  const result = await runQueryWithParams(query, [tourId], true);
  console.log("Query result: ", result, now);
  if (!result || result.length === 0) {
    return false;
  }
  return result[0].date_start <= now && result[0].date_end >= now
}

export async function getActiveTournaments(): Promise<Tournament[]> {
  const now = dateSec();
  const query = `SELECT id, title, description, date_start, date_end FROM tournaments WHERE date_end > $1;`;
  const result = await runQueryWithParams(query, [now], true);
  return result && result.length > 0 ? result : [];
}

export async function getFinishedTournaments(): Promise<Tournament[]> {
  const now = dateSec();
  const query = `SELECT id, date_start, date_end FROM tournaments WHERE date_end <= $1`;
  const result = await runQueryWithParams(query, [now], true);
  return result && result.length > 0 ? result : [];
}

export async function getUserTournamentDuelCount (userId: number, tourId: number) {
    
}

export async function createTournament(
  data: Tournament,
): Promise<Tournament | null> {
  const now = dateSec();
  const newTournamentQuery = `INSERT INTO tournaments (date_start, date_end, title, description) 
  VALUES ($1, $2, $3, $4) RETURNING id`;
  const result = await runQueryWithParams(newTournamentQuery, [
    data.date_start,
    data.date_end,
    data.title || '',
    data.description || '',
  ]);

  return result && result?.length > 0
    ? { id: Number(result[0].id), ...data }
    : null;
}
