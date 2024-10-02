import { runQueryWithParams } from '../connection';

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
