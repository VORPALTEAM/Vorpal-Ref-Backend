import { runQuery as Q } from '../connection';
import { getUserBalanceRow } from '../rewards';
import { TelegramAuthData, StoreItem, storeItemBalance } from '../../types';

export async function addStoreItem(item: StoreItem) {
  const query = `INSERT INTO "store_items" 
    ("item", "type", "rareness", "description", "img_preview", "img_full", "per_user", "total_count", "cost", "currency")
    VALUES ('${item.item}', '${item.type}', '${item.rareness}', 
    '${item.description || ''}', 
    '${item.img_preview || ''}', 
    '${item.img_full || ''}', 
    ${item.per_user}, 
    ${item.total_count}, 
    ${item.cost}, 
    '${item.currency}');`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getStoreItems(): Promise<StoreItem[]> {
  const query = `SELECT * FROM "store_items";`;
  const result = await Q(query);
  return result || [];
}

export async function getStoreItem(
  param: string,
  value: string | number,
): Promise<StoreItem | null> {
  const query = `SELECT * FROM "store_items" WHERE "${param}" = ${value};`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0] : null;
}

export async function createItemBalanceRow(login: string, itemId: number) {
  const query = `INSERT INTO "store_item_balances" ("user_name", "item_id", "balance")
    VALUES ('${login}', ${itemId}, 0);`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getUserItemBalance(
  login: string,
  itemId: number,
): Promise<number | null> {
  const query = `SELECT * FROM "store_item_balances" 
   WHERE "user_name" = '${login}' AND "item_id" = ${itemId};`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].balance : null;
}

export async function getUserAllItemBalances(
  login: string,
): Promise<{ itemId: number; balance: number }[] | null> {
  const query = `SELECT * FROM "store_item_balances" 
   WHERE "user_name" = '${login}';`;
  const result = await Q(query);
  return result
    ? result.map((item) => {
        return {
          itemId: item.item_id,
          balance: item.balance,
        };
      })
    : [];
}

export async function isItemAvailableToBuy(
  login: string,
  itemId: number,
  amount: number,
) {
  const storeItem = await getStoreItem('id', itemId);
  const itemBalance = await getUserItemBalance(login, itemId);
  const currencyBalance = await getUserBalanceRow(login, login);

  if (!storeItem) {
    return {
      ok: false,
      error: 'Store item not exist',
    };
  }

  if (
    storeItem.per_user !== null &&
    itemBalance !== null &&
    itemBalance >= storeItem.per_user
  ) {
    return {
      ok: false,
      error: 'User balance reached amount available per one user',
    };
  }

  if (storeItem.total_count !== null && amount > storeItem.total_count) {
    return {
      ok: false,
      error: 'Amount larger than available for sale',
    };
  }

  if (storeItem.cost * amount > currencyBalance[storeItem.currency]) {
    return {
      ok: false,
      error: 'Insufficient funds to buy',
    };
  }
  return {
    ok: true,
    error: '',
  };
}

export async function buyItem(buyer: string, itemId: number, amount: number) {
  const isAvailable = await isItemAvailableToBuy(buyer, itemId, amount);
  if (!isAvailable.ok) {
    return isAvailable;
  }
  const itemBalance = await getUserItemBalance(buyer, itemId);
  if (itemBalance === null) {
    await createItemBalanceRow(buyer, itemId);
  }
  const currencyQuery = `SELECT "currency", "cost" FROM "store_items" WHERE "id" = ${itemId};`;
  let currency = '';
  let cost = 0;
  const currencyResult = await Q(currencyQuery);
  if (!currencyResult || currencyResult.length === 0)
    return 'Currency not found';
  currency = currencyResult[0].currency;
  cost = currencyResult[0].cost;

  const balanceQuery = `UPDATE "store_item_balances" SET balance = balance + ${amount}
  WHERE "user_name" = '${buyer}' AND "item_id" = ${itemId};`;
  const storeQuery = `UPDATE "store_items" SET total_count = total_count - ${amount}
  WHERE "id" = ${itemId};`;
  const subBalanceQuery = `UPDATE "resources" SET ${currency} = ${currency} - ${cost} 
  where ownerlogin = '${buyer}' OR owneraddress = '${buyer}';`;

  const result = await Promise.all([
    Q(balanceQuery, false),
    Q(storeQuery, false),
    Q(subBalanceQuery, false),
  ]);
  return {
    ok: result.indexOf(null) > -1 ? false : true,
    error: result.indexOf(null) > -1 ? 'Unknown' : '',
  };
}