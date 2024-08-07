import { runQuery as Q } from '../connection';
import {
  ReferralStatsData,
  TelegramAuthData,
  TelegramAuthNote,
} from '../../types';


export async function GetUserInviter(username: string): Promise<string> {
  const query = `SELECT "inviter" FROM "telegram_personal" WHERE "username" = '${username}';`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].inviter : "";
}

export async function GetUserInviterById(userId: string): Promise<string> {
  const query = `SELECT "inviter" FROM "telegram_personal" WHERE "user_id" = '${userId}';`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].inviter : "";
}

export async function WriteReferralStats(data: {
  to: string;
  for: string;
  resource: string;
  amount: number;
  level: number;
  date?: number;
}) {
  const dt = data.date || Math.round(new Date().getTime() / 1000);
  const query = `INSERT INTO "telegram_referral_stats"  ("recipient", "referrer", "resource", "amount", "reward_date", "level") 
  VALUES ('${data.to.toLowerCase()}', '${data.for.toLowerCase()}', '${
    data.resource
  }', ${data.amount}, ${dt}, ${data.level});`;
  console.log("Ref stats update query: ", query )
  const result = await Q(query, false);
  return result ? true : false;
}

export async function GetReferralList(inviter: string): Promise<string[]> {
  const query = `SELECT "user_id", "username", "first_name", "last_name" FROM "telegram_personal" WHERE "inviter" = '${inviter}';`;
  const result = await Q(query);
  return result ? result.map((row) => {
    return String(row.id || ``)
  }) : []
}

export async function GetReferralCount(inviter: string): Promise<{level1: number; level2: number;}> {
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

export async function GetReferralStatsByUser(
  login: string,
  limit = 5
): Promise<ReferralStatsData[]> {
  const query = `SELECT id, recipient, referrer, resource, amount, reward_date, level
	FROM "telegram_referral_stats" WHERE recipient = '${login.toLowerCase()}' ORDER BY reward_date DESC LIMIT ${limit};`;
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

export async function GetReferralTotalRewardsByUser(login: string): Promise<{item: string; amount: number}[]> {
  const query = `
     SELECT resource, SUM(amount) as total_amount
       FROM "telegram_referral_stats"
       WHERE recipient = '${login.toLowerCase()}'
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
