import md5 from 'md5';
import { duel_lifetime } from '../../config';
import { DuelInfo } from '../../types';
import { getValueByKey, setValueByKey } from '../common';
import { runQuery as Q, runQueryWithParams } from '../connection';
import { getPersonalDataById } from './personal';
import { getAuthData, getUserById, getUserData } from '../../models/user';
import { notifyAdminDuelTournamentResult, notifyDuelCancel } from '../../telegram/publisher/commands';
import { isDuelInActiveTournament } from '../tournament';

const onlineCountKey = 'DUEL_ONLINE_COUNT';

export async function setOnlineCount(count: number) {
  await setValueByKey(onlineCountKey, count);
  return true;
}

export async function getOnlineCount() {
  return await getValueByKey(onlineCountKey);
}

export async function addDuelOpponent(duelId: number, userId: number) {
  const query = `UPDATE "duels" SET "user_2_id" = ${userId} WHERE "id" = ${duelId};`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getDuelPairCount(
  userId1: number,
  userId2: number,
): Promise<number> {
  const query = `SELECT COUNT(*) FROM "duels" WHERE (user_1_id = ${userId1} AND user_2_id = ${userId2}) OR (user_2_id = ${userId1} AND user_1_id = ${userId2});`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].count : 0;
}

export async function isUserInDuel(userId: number) {
  const query = `SELECT "id", "creation", "user_1_id", "user_2_id" FROM "duels" WHERE ("user_1_id" = ${userId} OR "user_2_id" = ${userId}) AND is_finished = false;`;
  const result = await Q(query);
  if (!result || result.length === 0) {
    return null;
  }
  const duelRow = result[0];
  const timeS = Math.round(new Date().getTime() / 1000);
  const duelTime = Number(duelRow.creation);
  if (timeS - duelTime > duel_lifetime) {
    await finishDuel(duelRow.id, null);
    return null;
  }
  if (!duelRow.user_1_id || !duelRow.user_2_id) {
    return null;
  }
  return duelRow.id;
}

export async function getDuelData(duelId: number): Promise<DuelInfo | null> {
  const query = `SELECT "user_1_id", "user_2_id", "creation", "is_finished", "winner_id" FROM "duels" WHERE "id" = ${duelId};`;
  const result = await Q(query, true);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  const userData1 = await getUserById(row.user_1_id);
  const userData2 = await getUserById(row.user_2_id);

  const duelInfo: DuelInfo = {
    id: duelId,
    id1: row.user_1_id,
    id2: row.user_2_id,
    nickName1: userData1?.username || "Unnamed",
    nickName2: userData2?.username || "Unnamed",
    creation: row.creation,
    is_started: row.is_started,
    is_finished: row.is_finished,
    winner: row.winner
  }
  return duelInfo;
}

export async function getOpponent(userId: number) {
  const query = `SELECT "user_2_id" FROM "duels" WHERE "is_finished" = false AND "user_1_id1" = ${userId};`;
  const result = await Q(query);
  return !result || result.length === 0 ? null : result[0].login2;
}

export async function removeDuelOpponent(userId: number) {
  
  const findDuelQuery = `SELECT "id", "user_1_id" FROM "duels" WHERE "is_finished" = false AND "user_2_id" = ${userId};`;
  const result = await Q(findDuelQuery);
  const duelId = result && result.length > 0 ? result[0].id : null;
  if (!duelId) return false;
  const removeSelfQuery = `UPDATE "duels" SET "user_2_id" = null WHERE "id" = ${duelId};`;
  const removeResult = await Q(removeSelfQuery, false);
  return removeResult ? true : false;
}

export async function getDuelDataByUser(
  userId: number,
): Promise<DuelInfo | null> {
  const query = `SELECT "id", "user_1_id", "user_2_id", "creation", "is_finished", "winner_id" FROM "duels" 
  WHERE "user_1_id" = ${userId} OR "user_2_id" = ${userId} ORDER BY "creation" DESC LIMIT 1;`;
  const result = await Q(query);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  console.log("Found row: ", row.id)
  const duelInfo: DuelInfo = {
    id: row.id,
    id1: row.user_1_id,
    id2: row.user_2_id,
    nickName1: (await getUserById(row.user_1_id))?.username || "Unnamed",
    nickName2: (await getUserById(row.user_2_id))?.username || "Unnamed",
    creation: row.creation,
    is_started: row.is_started,
    is_finished: row.is_finished,
    winner: row.winner
  }
  return duelInfo;
}

export async function getDuelDataByInviter(
  userId: number,
): Promise<DuelInfo | null> {
  const query = `SELECT "id", "user_1_id", "user_2_id", "creation", "is_finished", "winner_id" FROM "duels" 
  WHERE "user_1_id" = ${userId} ORDER BY "creation" DESC LIMIT 1;`;
  const result = await Q(query);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  const userPersonal1 = await getPersonalDataById(Number(row.user_1_id));
  const userPersonal2 = await getPersonalDataById(Number(row.user_2_id));
  const duelInfo: DuelInfo = {
    id: row.id,
    id1: row.user_1_id,
    id2:  row.user_2_id,
    nickName1: userPersonal1?.username || userPersonal1?.first_name || "Anonimous",
    nickName2: userPersonal2?.username || userPersonal1?.first_name || "Anonimous",
    creation: row.creation,
    is_started: row.isexpired,
    is_finished: row.isfinished,
    winner: row.winner
  }
  return duelInfo;
}

export async function finishDuel(duelId: number, winner: number | null) {
  if (!duelId) {
    console.log("Duel id not presented");
    return false;
  }
  const query = `UPDATE "duels" SET is_finished = true, winner_id = $1 WHERE "id" = $2;`;
  const checkTournamentQuery = "SELECT tournament_id FROM duel_in_tournament WHERE duel_id = $1;";
  const checkResult = await runQueryWithParams(checkTournamentQuery, [duelId], true);
  const result = await runQueryWithParams(query, [winner, duelId], false);

  if (result && checkResult && checkResult.length > 0) {
    notifyAdminDuelTournamentResult(duelId, checkResult[0].tournament_id, winner || undefined);
  }
  return result ? true : false;
}

export async function getDuelUsers (duelId: number): Promise<string[]> {
  const query = `
    SELECT tp.chat_id 
    FROM telegram_personal tp
    JOIN duels d ON tp.user_id = d.user_1_id OR tp.user_id = d.user_2_id
    WHERE d.id =  $1);
  `
  const result = await runQueryWithParams(query, [duelId], true);
  return result?.map(item => item.chat_id) || []
}

export async function deleteDuel(duelId: number) {

  const query = `DELETE FROM "duels" WHERE "id" = $1;`;
  const tourId = await isDuelInActiveTournament(duelId);
  if (tourId > 0) {
    notifyDuelCancel(duelId, tourId)
  }
  const result = await runQueryWithParams(query, [duelId], false);
  return result ? true : false;
}

export async function createDuel(user1: number, user2?: number): Promise<number | null> {

  const dt = Math.round(new Date().getTime() / 1000);
  const query = `INSERT INTO "duels" 
    ("user_1_id", "user_2_id", "creation", "is_started", "is_finished", "winner_id") 
    VALUES (${user1}, ${user2 || null}, ${dt}, false, false, null) RETURNING id;`;
  const result = await Q(query, true);
  return result && result.length > 0 ? result[0].id : null;
}

export async function getUserDuelCount (userId: number): Promise<number> {
   const query = `SELECT count(*) FROM duels WHERE user_1_id = ${userId} OR user_2_id = ${userId};`;
   const result = await Q(query, true);
   return result? result[0]?.count || 0 : 0;
}
