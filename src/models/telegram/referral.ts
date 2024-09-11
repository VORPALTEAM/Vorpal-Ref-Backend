import { runQuery as Q } from '../connection';
import {
  ReferralStatsData,
  TelegramAuthData,
  TelegramAuthNote,
} from '../../types';
import { getUserData } from '../../models/user';


export async function getUserInviter(user_id: number): Promise<number | null> {
  const query = `SELECT "inviter_id" FROM "users" WHERE "id" = ${user_id};`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].inviter_id : null;
}

export async function getUserInviterByTelegramId(userTelegramId: string): Promise<number | null> {
  const user = await getUserData(userTelegramId);
  if (!user) return null;
  const query = `SELECT "inviter_id" FROM "users" WHERE "id" IN 
  (SELECT user_id FROM "telegram_personal" WHERE chat_id = '${userTelegramId}');`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].inviter : "";
}

export async function writeReferralStats(data: {
  to: number;
  for: number;
  resource: number;
  amount: number;
  level: number;
  date?: number;
}) {
  const dt = data.date || Math.round(new Date().getTime() / 1000);
  const query = `INSERT INTO "telegram_referral_stats"  
  ("recipient", "referrer", "resource", "amount", "reward_date", "level") 
  VALUES ('${data.to}', '${data.for}', '${
    data.resource
  }', ${data.amount}, ${dt}, ${data.level});`;
  console.log("Ref stats update query: ", query )
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getReferralList(inviter: string): Promise<string[]> {
  const query = `SELECT "user_id", "username", "first_name", "last_name" FROM "telegram_personal" WHERE "inviter" = '${inviter}';`;
  const result = await Q(query);
  return result ? result.map((row) => {
    return String(row.id || ``)
  }) : []
}

export async function getReferralCount(inviter: string): Promise<{level1: number; level2: number;}> {
  const query1 = `SELECT COUNT(*) FROM "telegram_personal" WHERE "inviter" = '${inviter.toLowerCase()}';`;
  const level1 = await Q(query1, true);
  if (!level1) {
    return({
      level1: 0,
      level2: 0
    })
  }
  /* const query2=`SELECT COUNT(*) FROM "telegram_personal" WHERE "inviter" IN 
  (SELECT "inviter" FROM "telegram_personal" WHERE "inviter" = '${inviter.toLowerCase()}');`; */
  const query2=`SELECT COUNT(*) 
FROM "telegram_personal" 
WHERE "inviter" IN (
    SELECT "user_id" 
    FROM "telegram_personal" 
    WHERE "inviter" = '${inviter.toLowerCase()}'
);`
  const level2 = await Q(query2, true);
  return({
    level1: level1[0].count,
    level2: level2? level2[0].count : 0
  })
}

export async function getReferralStatsByUserTelegramId(
  login: string,
  limit = 5
): Promise<ReferralStatsData[]> {
  const user = await getUserData(login);
  if (!user) return [];
  const query = `SELECT id, recipient, referrer, resource, amount, reward_date, level
	FROM "telegram_referral_stats" WHERE recipient = ${user.id} ORDER BY reward_date DESC LIMIT ${limit};`;
  const data = await Q(query);
  return data ? data.map((row: any) => {
    return {
      id: row.id,
      to: row.recipient,
      for: row.referrer,
      resource: row.resource,
      amount: row.amount,
      level: row.level,
      date: row.reward_date,
    }
  }) : [];
}

export async function getReferralTotalRewardsByUser(login: string): Promise<{item: string; amount: number}[]> {
  const user = await getUserData(login);
  if (!user) return [];
  const query = `
     SELECT resource, SUM(amount) as total_amount
       FROM "telegram_referral_stats"
       WHERE recipient = ${user.id}
       GROUP BY resource
       ORDER BY total_amount DESC; 
  `
  const data = await Q(query);
  return data ? data.map((row: any) => {
    return {
      item: row.resource,
      amount: row.total_amount
    }
  }) : [];
}
