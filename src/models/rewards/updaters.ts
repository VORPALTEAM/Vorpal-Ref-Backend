require('dotenv').config();
import { TelegramAuthData, boxOpenResults } from 'types';
import { pool, runQuery, runQueryWithParams } from '../connection';
import { writeLog } from '../log';
import { getBoxOwner, getUserBalanceRow } from './getters';
import { getChannelSubscribeList } from '../../telegram/handlers/subscribe';
import { getUserInviter, getUserInviterByTelegramId, writeReferralStats } from '../telegram/referral';
import { referralPart1, referralPart2 } from '../../config';
import { getUserById, getUserData } from '../../models/user';

const rewardmessage = "Reward from box";
const rewardrefmessage = "Reward for referral";


export async function createNewBox(
  level: number,
  userId: number
): Promise<number | null> {

  const query = `
    INSERT INTO boxes (owner_id, level, is_open) 
    VALUES ($1, $2, false) RETURNING id;`;
  
  const box = await runQueryWithParams(query, [userId, level], true);
  return box && box.length > 0 ? box[0].id : null;
}

export async function giveResources(
  userId: number,
  resourceId: number,
  amount: number,
) : Promise<number> {
  const upsertQuery = `
  INSERT INTO user_balances (user_id, item_id, amount)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id, item_id) 
  DO UPDATE SET amount = user_balances.amount + $3
  RETURNING amount;
  `;
  const result = await runQueryWithParams(upsertQuery, [userId, resourceId, amount]);
  return result ? result[0]?.amount || 0 : 0;
}

export async function updateResourceTransaction(
  userId: number,
  resourceId: number,
  amount: number,
  message: string = '',
) {
  const time = Math.round(new Date().getTime() / 1000);
  const updateQuery = `INSERT INTO user_balances (user_id, item_id, amount)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET amount = user_balances.amount + $3
    WHERE user_balances.user_id = $1 
    AND user_balances.item_id = $2
    RETURNING *;`;
  const logQuery = `INSERT INTO "resource_txn_log" 
  ("userlogin", "time", "resource", "amount", "reason")
  VALUES ($1, TO_TIMESTAMP($2), $3, $4, $5);`;
  try {
    await Promise.all([
       runQueryWithParams(updateQuery, [userId, resourceId, amount]),
       runQueryWithParams(logQuery, [userId, time, resourceId, amount, message])
    ])
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

export async function sendRewardsToReferrals (userId: number, resourceId: number, amount: number) {
  const ref1 = (await getUserById(userId))?.inviter_id;
  if (!ref1) return([]);
  //const ref2 = (await getUserById(userId))
  const referral2 = (await getUserById(ref1))?.inviter_id;
  await writeReferralStats ({ to: ref1, for: userId, resource: resourceId, amount: amount * referralPart1, level: 1 })
  if (referral2) {
    await writeReferralStats ({ to: referral2, for: userId, resource: resourceId, amount: amount * referralPart2, level: 2 })
  }
  return Promise.all([
    updateResourceTransaction(ref1, resourceId, amount * referralPart1, rewardrefmessage),
    referral2 ? updateResourceTransaction(referral2, resourceId, amount * referralPart2, rewardrefmessage) : true,
  ])
}

export async function resourceTransactionWithReferrals (userId: number, resourceId: number, amount: number, message: string = "") {
  return Promise.all([
    updateResourceTransaction(userId, resourceId, amount, message),
    sendRewardsToReferrals(userId, resourceId, amount)
  ])
}

export async function openBox(boxId: number, telegramData: TelegramAuthData) {
  const boxCheckQuery = `SELECT is_open FROM boxes WHERE id = $1;`;
  const check = await pool.query(boxCheckQuery, [boxId]);
  if (check.rows.length === 0) {
    return {
      success: false,
      error: 'Box id not exist',
    };
  }
  if (check.rows[0].is_open === true || check.rows[0].is_open === 'true') {
    return {
      success: false,
      error: 'Box is already open',
    };
  }
  const owner = await getBoxOwner(boxId);
  if (!owner) {
    return {
      success: false,
      error: 'Box owner not found',
    };
  }
  const userId = (await getUserData(String(telegramData.id)))?.id;
  if (userId !== owner) {
    return {
      success: false,
      error: 'Caller is not a box owner',
    };
  }
  const openAmount = 10 + Math.round(Math.random() * 40);
  const value = Math.round(Math.random() * 10000);
  const valueVRP = Math.round(Math.random() * 5) + 5;

  await  resourceTransactionWithReferrals (owner, 1, valueVRP, rewardmessage);
  // await connection.query(vrpQuery);
  const rewardId: number = Math.floor(value / 2000) + 2;
  const logQuery = `INSERT INTO box_log (boxId, opening, openResult, openAmount)
    VALUES (${boxId}, CURRENT_TIMESTAMP, $1, $2);`;
  const boxCloseQuery = `UPDATE boxes SET is_open = true WHERE id = $1;`;
  const logs = await pool.query(logQuery, [rewardId, openAmount]);
  await  resourceTransactionWithReferrals (owner, rewardId, openAmount, rewardmessage);
  await pool.query(boxCloseQuery, [boxId]);
  return {
    success: true,
    result: [{
      resourceId: rewardId,
      amount: openAmount
    }, {
      resourceId: 1,
      amount: valueVRP
    }]
  };
}
