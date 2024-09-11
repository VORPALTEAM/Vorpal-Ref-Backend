import { runQuery as Q, runQuery } from '../connection';
import { getUserAssets, getUserBalanceRow } from '../rewards';
import { TelegramAuthData, StoreItem, storeItemBalance } from '../../types';

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

export async function getStoreItems(): Promise<StoreItem[]> {
  const query = `SELECT * FROM "items";`;
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
     UPDATE user_balances SET amount = amount + ${amount} WHERE user_id = ${buyerId} AND item_id = ${itemId};
     UPDATE user_balances SET amount = amount - ${amount * (saleData.price || 0)} WHERE user_id = ${buyerId} AND item_id = ${saleData.currency_id};
  `

  const result = await Q(buyQuery)
  return {
    ok: result ? true : false,
    error: !result ? 'Unknown' : '',
  };
}
