import { runQuery, runQueryWithParams } from '../../models/connection';

export interface TourWinnerInfo {
    tournament_id: number;
    user_id: number;
    place: number;
}

export async function setWinner(data: TourWinnerInfo): Promise<boolean> {
  const query = `
    INSERT INTO public.tournament_winners(
	  tournament_id, user_id, place)
  	VALUES ($1, $2, $3);
    `;
  const result = await runQueryWithParams(
    query,
    [data.tournament_id, data.user_id, data.place],
    false,
  );
  return !!result;
}

export async function getWinners(tourId: number): Promise<TourWinnerInfo[]> {
  const query = "SELECT * FROM tournament_winners WHERE tournament_id = $1;"
  const result = await runQueryWithParams(query, [tourId], true);
  return result || [];
}
