require('dotenv').config();
import { TelegramAuthData, boxOpenResults } from 'types';
import { pool, runQuery } from '../connection';
import { writeLog } from '../log';
import { getBoxOwner, getHolderData, getUserBalanceRow, isHolderExists } from './getters';
import { getChannelSubscribeList } from '../../telegram/handlers/subscribe';
import { getUserInviter, getUserInviterByTelegramId, writeReferralStats } from '../telegram/referral';
import { referralPart1, referralPart2 } from '../../config';
import { getUserById, getUserData } from 'models/user';

const rewardmessage = "Reward from box";
const rewardrefmessage = "Reward for referral";


export async function createNewBox(
  level: number,
  ownerAddress: string = '',
  ownerLogin: string = '',
): Promise<number | null> {
  const holder = ownerAddress.toLowerCase();
  const ownerId = (await getUserData(holder, holder))?.id
  if (!holder && !ownerLogin) return null;

  const query = `
    INSERT INTO boxes (owner_id, level, is_open) 
    VALUES (${ownerId}, ${level}, false) RETURNING id;`;
  console.log('Box creation query: ', query);
  // WriteLog('Box creation query: ', query);
  const box = await runQuery(query, true);
  return box && box.length > 0 ? box[0].id : null;
}

export async function giveResources(
  ownerAddress: string = '',
  ownerLogin: string = '',
  resource: string,
  amount: number,
) {
  const holder = ownerAddress.toLowerCase();
  const holderData = await isHolderExists(holder);

  if (!holderData) {
    const creation = await createNewHolder(holder, ownerLogin.toLowerCase());
  }
  const balanceQuery = `UPDATE resources SET ${resource} = ${resource} + ${amount} 
  WHERE ownerAddress = '${holder}';`;
  await pool.query(balanceQuery);
  return await getUserBalanceRow(holder, ownerLogin.toLowerCase());
}

export async function createNewHolder(address: string, login?: string) {
  const ownerLogin = (login || address).toLowerCase();
  const isUserExists = await isHolderExists(address.toLowerCase());
  if (isUserExists) {
    return false;
  }
  const creationQuery = `INSERT INTO resources 
  (ownerAddress, ownerLogin, laser1, laser2, laser3, spore, spice, metal, token, biomass, carbon, trends) 
  VALUES ('${address.toLowerCase()}', '${ownerLogin}', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);`;
  // WriteLog('User creation query: ', creationQuery);
  const result = await pool.query(creationQuery);
  // WriteLog('Insertion result: ', JSON.stringify(result));
  // console.log('Insertion result: ', result)
  return true;
}

export async function updateResourceTransaction(
  userId: number,
  resourceId: number,
  amount: number,
  message: string = '',
) {
  const time = Math.round(new Date().getTime() / 1000);
  const updateQuery = `INSERT INTO user_balances (user_id, item_id, count)
    VALUES (${userId}, ${resourceId}, ${amount})
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET count = user_balances.count + $3
    RETURNING *;`;
  const logQuery = `INSERT INTO "resource_txn_log" 
  ("userlogin", "time", "resource", "amount", "reason")
  VALUES ('${userId}', TO_TIMESTAMP(${time}), '${resourceId}', ${amount}, '${message}');`;
  try {
    await Promise.all([
       runQuery(updateQuery),
       runQuery(logQuery)
    ])
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

export async function sendRewardsToReferrals (userId: number, resourceId: number, amount: number) {
  const ref1 = (await getUserById(userId))
  if (!ref1) return([]);
  const ref2 = (await getUserById(userId))
  const referral2 = await getUserInviterByTelegramId (ref2.id);
  await writeReferralStats ({ to: ref1.id, for: ref2, resource: resourceId, amount: amount * referralPart1, level: 1 })
  if (referral2) {
    await writeReferralStats ({ to: referral2, for: ref1.id, resource: resourceId, amount: amount * referralPart1, level: 2 })
  }
  return Promise.all([
    updateResourceTransaction(userId, resourceId, amount * referralPart1, rewardrefmessage),
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
  let openAmount = 0;
  const boxCheckQuery = `SELECT isopen FROM boxes WHERE id = ${boxId};`;
  const check = await pool.query(boxCheckQuery);
  if (check.rows.length === 0) {
    return {
      success: false,
      error: 'Box id not exist',
    };
  }
  if (check.rows[0].isopen === true || check.rows[0].isopen === 'true') {
    return {
      success: false,
      error: 'Box is already open',
    };
  }
  const owner = await getBoxOwner(boxId);
  const value = Math.round(Math.random() * 10000);
  const valueVRP = Math.round(Math.random() * 5) + 5;
  await createNewHolder(
    String(telegramData?.id || ''),
    String(telegramData.username || telegramData.first_name),
  );
  /* if (telegramData) {
    const subscribes = await GetChannelSubscribeList(telegramData.id);
    if (subscribes.length === 0) {
      const trendsValue = 5 + Math.round(Math.random() * 5);
      // const trendsUpQuery = `UPDATE resources SET trends = trends + ${trendsValue} 
      // WHERE ownerAddress IN (SELECT ownerAddress FROM boxes WHERE id = ${boxId})`;
      // await connection.query(trendsUpQuery);
      await  resourceTransactionWithReferrals (owner, 'trends', trendsValue, rewardmessage);
    } 
  } */
  await  resourceTransactionWithReferrals (owner, 'token', valueVRP, rewardmessage);
  // const vrpQuery = `UPDATE resources SET token = token + ${valueVRP} 
  //     WHERE ownerAddress IN (SELECT ownerAddress FROM boxes WHERE id = ${boxId})`;
  // await connection.query(vrpQuery);
  const rewardType: boxOpenResults = (() => {
    switch (true) {
      /* case value < 100:
        openAmount = 1;
        return 'laser3';
      case value < 300:
        openAmount = 1;
        return 'laser2';
      case value < 1000:
        openAmount = 1;
        return 'laser1'; */
      /* case value < 2500:
        openAmount = value % 1000; 
        return 'token'; */
      case value < 2000:
        openAmount = value % 1000;
        return 'spice';
      case value < 4000:
        openAmount = value % 1000;
        return 'spore';
      case value < 6000:
        openAmount = value % 1000;
        return 'metal';
      case value < 8000:
        openAmount = value % 1000;
        return 'biomass';
      case value <= 10000:
        openAmount = value % 1000;
        return 'carbon';
      default:
        openAmount = value % 1000;
        return 'token';
    }
  })();
  const logQuery = `INSERT INTO box_log (boxId, opening, openResult, openAmount)
    VALUES (${boxId}, CURRENT_TIMESTAMP, '${rewardType}', ${openAmount});`;
  const boxCloseQuery = `UPDATE boxes SET isopen = true WHERE id = ${boxId};`;
  const logs = await pool.query(logQuery);
  await  resourceTransactionWithReferrals (owner, rewardType, openAmount, rewardmessage);
  await pool.query(boxCloseQuery);
  return {
    success: true,
  };
}
