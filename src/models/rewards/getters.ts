require('dotenv').config();
import { runQuery as Q } from '../connection';
// import { WriteLog } from '../../database/log';

const zeroAssets = {
  laser1: 0,
  laser2: 0,
  laser3: 0,
  token: 0,
  spore: 0,
  spice: 0,
  metal: 0,
  biomass: 0,
  carbon: 0,
  trends: 0
}

export async function getBoxOpenResult(boxId: number) {
  const logQuery = `SELECT * FROM box_log WHERE id = ${boxId};`;
  const result = await Q(logQuery);
  if (!result|| result.length === 0) {
    return {
      success: false,
      error: 'Box not open or not exist',
    };
  }
  return {
    success: true,
    data: result,
  };
}

export async function getLoginByAddress(address: string) {

}

export async function getUserAssets (userId: number) {

  const balanceMap = new Map<string, number>()
  const query = `SELECT items.name, ub.amount FROM user_balances AS ub, items 
  WHERE ub.item_id = items.id AND ub.user_id = ${userId};`
  const result = await Q(query, true);
  if (result && result.length > 0) {
    result.forEach((item) => {
      balanceMap.set(item.name, item.amount)
    })
  }
  return Object.fromEntries(balanceMap);
}

export async function getBoxOwner(boxId: number): Promise<number | null> {
  const selectionQuery = `
        SELECT owner_id FROM boxes WHERE id = ${boxId};
      `;
  const result = await Q(selectionQuery);
  if (result && result.length > 0) {
    return result[0].owner_id;
  } else {
    return null;
  }
}

export async function getUserBalanceRow(userId: number) {
  const balancesList = {};
  for (let key in zeroAssets) {
    const balanceQuery = `SELECT amount FROM user_balaces WHERE user_id = ${userId} AND item_id IN 
   (SELECT id FROM items WHERE name = '${key}');`;
   const result = await Q(balanceQuery, true);
   const value = result && result.length > 0 ? Number(result[0].amount) || 0 : 0;
   Object.assign(balancesList, { key: value })
  }
  return balancesList;
}

export async function getAvailableBoxesByOwner(
  userId: number
) {
  const listQuery = `SELECT * FROM boxes WHERE owner_id = ${userId} AND isOpen = false;`;
  const response = await Q(listQuery);
  return response || [];
}
