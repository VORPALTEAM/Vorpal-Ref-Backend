import { runQuery as Q, runQueryWithParams } from '../connection';
import {
  ReferralStatsData,
  TelegramAuthData,
  TelegramAuthNote,
} from '../../types';
import { getUserData } from '../../models/user';

interface ReferralTransactionData {
  to: number;
  for: number;
  resource: number;
  amount: number;
  level: number;
  date?: number;
}

export async function getUserInviter(user_id: number): Promise<number | null> {
  const query = `SELECT "inviter_id" FROM "users" WHERE "id" = $1;`;
  const result = await runQueryWithParams(query, [user_id]);
  return result && result.length > 0 ? result[0].inviter_id : null;
}

export async function getUserInviterByTelegramId(userTelegramId: string): Promise<number | null> {
  const user = await getUserData(userTelegramId);
  if (!user) return null;
  const query = `SELECT "inviter_id" FROM "users" WHERE "id" IN 
  (SELECT user_id FROM "telegram_personal" WHERE chat_id = $1);`;
  const result = await runQueryWithParams(query, [userTelegramId]);
  return result && result.length > 0 ? result[0].inviter : "";
}

export async function writeReferralStats(data: ReferralTransactionData) {
  const dt = data.date || Math.round(new Date().getTime() / 1000);
  const query = `INSERT INTO "telegram_referral_stats"  
  ("recipient", "referrer", "resource", "amount", "reward_date", "level") 
  VALUES ($1, $2,  $3, $4, $5, $6);`;
  const result = await runQueryWithParams(query, [data.to, data.for, data.resource, data.amount, dt, data.level], false);
  return result ? true : false;
}

export async function getReferralList(inviterId: number): Promise<string[]> {
  const query = `SELECT "id", "username" FROM "users" WHERE "inviter_id" = $1;`;
  const result = await runQueryWithParams(query, [inviterId]);
  return result ? result.map((row) => {
    return String(row.id || ``)
  }) : []
}

export async function getReferralCount(inviterId: number): Promise<{level1: number; level2: number;}> {
  const query1 = `SELECT COUNT(*) FROM "users" WHERE "inviter_id" = ${inviterId};`;
  const level1 = await Q(query1, true);
  if (!level1) {
    return({
      level1: 0,
      level2: 0
    })
  }

  const query2=`SELECT COUNT(*) 
  FROM "users" 
  WHERE "inviter_id" IN (
    SELECT "id" 
    FROM "users" 
    WHERE "inviter_id" = $1
);`
  const level2 = await runQueryWithParams(query2, [inviterId], true);
  return({
    level1: level1[0].count,
    level2: level2? level2[0].count : 0
  })
}

export async function getReferralStatsByUserId (userId: number, limit: number) {
  const query = `
  SELECT trs.id, items.id, 
    items.name as rs_name, 
    trs.recipient, trs.referrer, trs.resource, 
    trs.amount, trs.reward_date, trs.level
	FROM "telegram_referral_stats" as trs, items 
  WHERE trs.recipient = $1
  AND items.id = resource
  ORDER BY reward_date DESC LIMIT $2;`;
  const data = await runQueryWithParams(query, [userId, limit]);

  return data ? data.map((row: any) => {
    return {
      id: row.id,
      to: row.recipient,
      for: row.referrer,
      resource: row.rs_name,
      amount: row.amount,
      level: row.level,
      date: row.reward_date,
    }
  }) : [];
}

export async function getReferralStatsByUserTelegramId(
  login: string,
  limit = 5
): Promise<ReferralStatsData[]> {
  const user = await getUserData(login);
  if (!user) return [];
  return await getReferralStatsByUserId(user.id, limit)
}

export async function getReferralTotalRewardsById (userId: number): Promise<{item: string; amount: number}[]> {
  const query = `
     SELECT items.id, items.name as item_name, trs.resource, SUM(trs.amount) as total_amount
     FROM "telegram_referral_stats" as trs
     JOIN "items" ON items.id = trs.resource
     WHERE trs.recipient = $1
     GROUP BY items.id, items.name, trs.resource
     ORDER BY total_amount DESC;
  `
  const data = await runQueryWithParams(query, [userId]);
  return data ? data.map((row: any) => {
    return {
      item: row.item_name,
      amount: row.total_amount
    }
  }) : [];
} 

export async function getReferralTotalRewardsByUser(login: string): Promise<{item: string; amount: number}[]> {
  const user = await getUserData(login);
  if (!user) return [];
  return await getReferralTotalRewardsById(user.id);
}
