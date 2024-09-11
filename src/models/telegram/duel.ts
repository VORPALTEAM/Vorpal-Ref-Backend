import md5 from 'md5';
import { duel_lifetime } from '../../config';
import { DuelInfo } from '../../types';
import { getValueByKey, setValueByKey } from '../common';
import { runQuery as Q } from '../connection';
import { getPersonalDataById } from './personal';
import { getAuthData, getUserById, getUserData } from 'models/user';

const onlineCountKey = 'DUEL_ONLINE_COUNT';

export async function setOnlineCount(count: number) {
  await setValueByKey(onlineCountKey, count);
  return true;
}

export async function getOnlineCount() {
  return await getValueByKey(onlineCountKey);
}

export async function addDuelOpponent(duelId: number, userId: number) {
  const query = `UPDATE "duels" SET "user_id_2" = ${userId} WHERE "id" = ${duelId};`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getDuelPairCount(
  userId1: number,
  userId2: number,
): Promise<number> {
  const query = `SELECT COUNT(*) FROM "duels" WHERE (user_id_1 = ${userId1} AND user_id_2 = ${userId2}) OR (user_id_1 = ${userId1} AND user_id_2 = ${userId2});`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].count : 0;
}

export async function isUserInDuel(userId: number) {
  const query = `SELECT "id", "creation", "user_id_1", "user_id_2" FROM "duels" WHERE ("user_id_1" = ${userId} OR "user_id_2" = ${userId}) AND is_finished = false;`;
  const result = await Q(query);
  if (!result || result.length === 0) {
    return null;
  }
  const duelRow = result[0];
  const timeS = Math.round(new Date().getTime() / 1000);
  const duelTime = Number(duelRow.creation);
  if (timeS - duelTime > duel_lifetime) {
    await finishDuel(duelRow.duel_id, null);
    return null;
  }
  if (!duelRow.login1 || !duelRow.login2) {
    return null;
  }
  return duelRow.duel_id;
}

export async function getDuelData(duelId: number): Promise<DuelInfo | null> {
  const query = `SELECT "user_id_1", "login2", "creation", "isfinished", "winner" FROM "duels" WHERE "id" = ${duelId};`;
  const result = await Q(query, true);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  const duelInfo: DuelInfo = {
    id: String(duelId),
    id1: (await getAuthData(row.user_id_1))?.telegram.chat_id,
    id2: (await getAuthData(row.user_id_2))?.telegram.chat_id,
    nickName1: (await getUserById(row.user_id_1))?.username || "Unnamed",
    nickName2: (await getUserById(row.user_id_2))?.username || "Unnamed",
    creation: row.creation,
    is_started: row.is_started,
    is_finished: row.is_finished,
    winner: row.winner
  }
  return duelInfo;
}

export async function getOpponent(userId: number) {
  const query = `SELECT "user_id_2" FROM "duels" WHERE "is_finished" = false AND "user_id_11" = ${userId};`;
  const result = await Q(query);
  return !result || result.length === 0 ? null : result[0].login2;
}

export async function removeDuelOpponent(userId: number) {
  
  const findDuelQuery = `SELECT "id", "user_id_1" FROM "duels" WHERE "is_finished" = false AND "user_id_2" = ${userId};`;
  const result = await Q(findDuelQuery);
  const duelId = result && result.length > 0 ? result[0].id : null;
  if (!duelId) return false;
  const removeSelfQuery = `UPDATE "duels" SET "user_id_2" = null WHERE "id" = ${duelId};`;
  const removeResult = await Q(removeSelfQuery, false);
  return removeResult ? true : false;
}

export async function getDuelDataByUser(
  userId: number,
): Promise<DuelInfo | null> {
  const query = `SELECT "id", "user_id_1", "user_id_2", "creation", "is_finished", "winner" FROM "duels" 
  WHERE "user_id_1" = ${userId} OR "user_id_2" = ${userId} ORDER BY "creation" DESC LIMIT 1;`;
  const result = await Q(query);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  const duelInfo: DuelInfo = {
    id: row.id,
    id1: (await getAuthData(row.user_id_1))?.telegram.chat_id,
    id2: (await getAuthData(row.user_id_2))?.telegram.chat_id,
    nickName1: (await getUserById(row.user_id_1))?.username || "Unnamed",
    nickName2: (await getUserById(row.user_id_2))?.username || "Unnamed",
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
  const query = `SELECT "id", "user_id_1", "user_id_2", "creation", "is_finished", "winner" FROM "duels" 
  WHERE "user_id_1" = ${userId} ORDER BY "creation" DESC LIMIT 1;`;
  const result = await Q(query);
  if (!result || result.length === 0) return null;
  const row: any = result[0];
  const userPersonal1 = await getPersonalDataById(Number(row.login1));
  const userPersonal2 = await getPersonalDataById(Number(row.login2));
  const duelInfo: DuelInfo = {
    id: row.duel_id,
    id1: String(row.login1),
    id2: String(row.login2),
    nickName1: isNaN(Number(row.login1)) ? row.login1 : userPersonal1 ? userPersonal1.username || userPersonal1.first_name || "Anonimous" : "Anonimous",
    nickName2: isNaN(Number(row.login2)) ? row.login2 : userPersonal2 ? userPersonal2.username || userPersonal2.first_name || "Anonimous" : "Anonimous",
    creation: row.creation,
    is_started: row.isexpired,
    is_finished: row.isfinished,
    winner: row.winner
  }
  return duelInfo;
}

export async function finishDuel(duelId: number, winner: number | null) {
  const query = `UPDATE "duels" SET is_finished = true, winner = ${winner} WHERE "id" = ${duelId};`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function deleteDuel(duelId: number) {
  const query = `DELETE FROM "duels" WHERE "id" = ${duelId};`;
  console.log('Delete duel called');
  const result = await Q(query, false);
  return result ? true : false;
}

export async function createDuel(user1: number, user2?: number) {

  const dt = Math.round(new Date().getTime() / 1000);
  const query = `INSERT INTO "duels" 
    ("user_id_1", "user_id_2", "creation", "is_started", "is_finished", "winner") 
    VALUES (${user1}, ${user2 || null}, ${dt}, false, false, null) RETURNING id;`;
  const result = await Q(query, true);
  return result && result.length > 0 ? result[0].id : null;
}

export async function getUserDuelCount (userId: number): Promise<number> {
   const query = `SELECT count(*) FROM duels WHERE user_id_1 = ${userId} OR user_id_2 = ${userId};`;
   const result = await Q(query, true);
   return result? result[0]?.count || 0 : 0;
}
