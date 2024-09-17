import { runQuery as Q, runQuery } from '../connection';
import { getUserAssets, getUserBalanceRow, zeroAssets } from '../rewards';
import { TelegramAuthData, StoreItem, storeItemBalance, DisplayStoreItem } from '../../types';

export async function addStoreItem(item: StoreItem) {
  const query = `INSERT INTO public.items(
	name, total_count, img_preview, img_full, type, rareness, description)
	VALUES ('${item.name}', ${item.total_count}, 
  '${item.img_preview || ""}', '${item.img_full||""}', 
  '${item.type || ""}', '${item.rareness || "usual"}', 
  '${item.description || ""}') RETURNING "id";`;
  const result = await Q(query, true);
  return result && result.length > 0? result[0].id : null;
}

export async function putItemOnSale (data: {
  itemId: number, 
  price?: number, 
  currencyId?: number,
  userBalanceLimit?: number,
  availableCount?: number
  }) {
  const query = `
     INSERT INTO public.store(
	    item_id, currency_id, price, user_balance_limit, available_count)
	   VALUES (${data.itemId}, ${data.currencyId || 1}, ${data.price || 0}, 
     ${data.userBalanceLimit || null}, ${data.availableCount || null}) RETURNING id;
  `
  return await runQuery(query, false);
}

/*
export interface DisplayStoreItem {
  id: number;
  item: string;
  type: string;
  rareness: string;
  description?: string;
  img_preview?: string;
  img_full?: string;
  per_user: number | null;
  total_count: number | null;
  cost: number;
  currency: string;
}

CREATE TABLE IF NOT EXISTS "store" (
     id serial PRIMARY KEY,
     item_id integer,
     currency_id integer,
     price integer,
     user_balance_limit integer,
     available_count integer
    );

CREATE TABLE IF NOT EXISTS "items" (
     id serial PRIMARY KEY,
     name varchar(32) NOT NULL UNIQUE,
     total_count integer,
     img_preview varchar(256),
     img_full varchar(256),
     type varchar(32), 
     rareness varchar(32), 
     description varchar(128)
    );
*/

export async function getStoreItems(): Promise<DisplayStoreItem[]> {
  const query = `
  SELECT items.id, items.name as item, items.type,
    items.rareness, items.description, items.img_preview, items.img_full,
    store.user_balance_limit as per_user, store.available_count as total_count,
    store.price as cost, ide.title, ide.description_en, 
    currency_items.name as currency
  FROM "items"
  JOIN "store" ON store.item_id = items.id
  JOIN "item_description_extended" as "ide" ON ide.item_id = items.id
  LEFT JOIN "items" as currency_items ON currency_items.id = store.currency_id
  WHERE items.id IN (SELECT item_id FROM store);`;
  const result = await Q(query);

  // Replace null in rareness with "usual"
  return (result || []).map(item => ({
    ...item,
    item: item.title,
    description: item.description_en,
    currency: item.currency === "VRP" ? "token" : item.currency,
    rareness: item.rareness === null ? 'usual' : item.rareness
  }));
}

export async function getStoreItem(
  param: string,
  value: string | number,
): Promise<DisplayStoreItem | null> {
  const query = `
    SELECT items.id, items.name as item, items.type,
      items.rareness, items.description, items.img_preview, items.img_full,
      store.user_balance_limit as per_user, store.available_count as total_count,
      store.price as cost, 
      currency_items.name as currency
    FROM "items"
    JOIN "store" ON store.item_id = items.id
    LEFT JOIN "items" as currency_items ON currency_items.id = store.currency_id
    WHERE items."${param}" = '${value}'
    LIMIT 1;
  `;
  const result = await Q(query);
  return result && result.length > 0 ? {
    ...result[0],
    currency: result[0].currency === "VRP" ? "token" : result[0].currency,
    rareness: result[0].rareness === null ? 'usual' : result[0].rareness
  } : null;
}

export async function getUserItemBalance(
  userId: number,
  itemId: number,
): Promise<number | null> {
  const query = `SELECT amount FROM "user_balances" 
   WHERE "user_id" = '${userId}' AND "item_id" = ${itemId};`;
  const result = await Q(query);
  return result && result.length > 0 ? result[0].amount : null;
}

export async function getUserAllItemBalances(
  userId: number,
): Promise<{ itemId: number; balance: number }[] | null> {
  const query = `SELECT item_id, amount FROM "user_balances" 
   WHERE "user_id" = '${userId}';`;
  const result = await Q(query);
  return result
    ? result.map((item) => {
        return {
          itemId: item.item_id,
          balance: item.amount,
        };
      })
    : [];
}

export interface itemSaleData 
  {
    id: number;
    name: string;
    price?: number;
    currency_id: number;
    user_balance_limit?: number;
    available_count?: number;
  }


export async function getItemSaleData (itemId: number): Promise<itemSaleData | null> {
  const query = `SELECT store.price, store.currency_id, store.user_balance_limit, store.available_count, items.id, items.name
  FROM store, items WHERE store.item_id = items.id AND store.item_id = ${itemId};`;
  const result = await Q(query, true);
  return result && result.length > 0 ? result[0] : null
}

export async function getUserAssetsWithNames (userId: number) {
  const result = new Map();
  const query = `
  SELECT items.name, user_balances.amount FROM items, user_balances 
  WHERE items.id = user_balances.item_id
  AND user_balances.user_id = ${userId};
  `
  const items = await Q(query, true);
  if (items) {
    items.forEach((i) => {
      result.set(i.name === "VRP" ? "token" : i.name, i.amount)
    });
  }
  for(let key in zeroAssets) {
     if (!result.get(key)) {
       result.set(key, 0);
     }
  }
  return Object.fromEntries(result);
}

export async function getItemName (itemId: number) {
  const query = `SELECT name FROM items WHERE id = ${itemId};`;
  const result = await Q(query, true);
  return result && result.length > 0 ? result[0].name : null
}

export async function isItemAvailableToBuy(
  userId: number,
  itemId: number,
  amount: number,
) {
  const userAssets = await getUserAssets(userId);
  const saleData = await getItemSaleData(itemId);

  if (!saleData) {
    return {
      ok: false,
      error: 'Store item is not for sale',
    };
  }

  const currencyName = await getItemName (saleData.currency_id)

  if (
    saleData.user_balance_limit &&
    userAssets[saleData.name] &&
    userAssets[saleData.name] + amount > saleData.user_balance_limit
  ) {
    return {
      ok: false,
      error: 'User balance reached amount available per one user',
    };
  }

  if ((saleData.available_count || saleData.available_count === 0) && amount > saleData.available_count) {
    return {
      ok: false,
      error: 'Amount larger than available for sale',
    };
  }

  if ((saleData.price || saleData.price === 0) &&  saleData.price * amount > userAssets[currencyName]) {
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

export async function decreaseSaleAmount (itemId: number, amount = 1) {
  const query = `
  UPDATE items 
    SET total_amount = GREATEST(total_amount - ${amount}, 0) 
    WHERE id = ${itemId} AND total_amount IS NOT NULL;
  
  UPDATE store 
    SET available_count = GREATEST(available_count - ${amount}, 0) 
    WHERE item_id = ${itemId} AND available_count IS NOT NULL;
  `;
   return await runQuery(query)  
}

export async function buyItem(buyerId: number, itemId: number, amount: number) {
  const isAvailable = await isItemAvailableToBuy(buyerId, itemId, amount);
  if (!isAvailable.ok) {
    return isAvailable;
  }

  const saleData = await getItemSaleData(itemId);
  if (!saleData) {
    return false;
  }

  const buyQuery = `
         BEGIN;

         INSERT INTO user_balances (user_id, item_id, amount)
         VALUES (${buyerId}, ${itemId}, ${amount})
         ON CONFLICT (user_id, item_id)
         DO UPDATE SET amount = user_balances.amount + ${amount};

         UPDATE user_balances
         SET amount = amount - ${amount * (saleData.price || 0)}
        WHERE user_id = ${buyerId} AND item_id = ${saleData.currency_id};

        COMMIT;
  `

  const result = await Q(buyQuery);
  if (result) {
    decreaseSaleAmount(itemId, amount)
  }
  return {
    ok: result ? true : false,
    error: !result ? 'Unknown' : '',
  };
}
