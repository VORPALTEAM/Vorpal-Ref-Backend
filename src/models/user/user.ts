import { massRunQueries, runQuery } from '../connection';
import { TelegramAuthData, TelegramAuthNote } from '../../types';
import {
  decodeTgInitData,
  getSignableMessage,
  validateByInitData,
} from '../../utils/auth';
import { generateWalletShortedName } from '../../utils/wallet';

export async function createUserIfNotExists(
  role = 'user',
  username?: string,
  inviterId?: number,
  telegramData?: TelegramAuthData
) {
  const userData = await getUserData(String(telegramData?.id || ""))
  if (userData) {
    return Number(userData.id)
  }

  const userId = await createUser(role, username, inviterId, telegramData);
  return userId;
}

export async function createUser(
  role = 'user',
  username?: string,
  inviterId?: number,
  telegramData?: TelegramAuthData,
  ercWallets?: string[],
  tonWallets?: string[],
): Promise<number> {
  const wallets = tonWallets?.concat(ercWallets || []);
  return new Promise(async (resolve, reject) => {
    const isUserExists = await checkIsUserExists(telegramData, wallets);

    if (isUserExists) {
      reject('User already exists');
      return 0;
    }

    const userName =
      username ||
      telegramData?.username ||
      telegramData?.first_name ||
      generateWalletShortedName(
        ercWallets && ercWallets.length > 0
          ? ercWallets[0]
          : tonWallets && tonWallets.length > 0
          ? tonWallets[0]
          : '',
      );
    const creationQuery = `
           INSERT INTO "users" ("inviter_id", "username", "role_id")
           VALUES (${inviterId || null}, '${userName}', 1)
           RETURNING "id";
        `;

    const userCreation = await runQuery(creationQuery, true);

    if (!userCreation || userCreation.length === 0 || !userCreation[0].id) {
      reject('User creation result is invalid');
      return;
    }

    const userId = Number(userCreation[0]?.id);

    assignDataToUser(userId, telegramData, ercWallets, tonWallets);

    resolve(userId);
  });
}

export async function checkIsUserExists(
  telegramData?: TelegramAuthData, // Use only one method, with priority
  wallets?: string[],
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let userCount = 0;
    const queries: string[] = [];

    if (!telegramData && !wallets) {
      reject('No data to check');
      return false;
    }

    if (telegramData && telegramData.id) {
      queries.push(`
                  SELECT COUNT(*) from "users" 
                   WHERE "id" IN (SELECT "user_id" FROM "telegram_personal" 
                   WHERE "chat_id" = '${telegramData.id}');
                `);
    }

    if (wallets && wallets.length > 0) {
      queries.push(`
                SELECT COUNT(*) from "users" 
                 WHERE "id" IN (SELECT "user_id" FROM "wallets";`);
    }
    massRunQueries(queries).then((res) => {
      res.forEach((row) => {
        if (row && row[0]?.count > 0) {
          userCount += Number(row[0].count);
        }
      });
      resolve(!(userCount === 0));
      return !(userCount === 0);
    });
  });
}

export async function assignDataToUser(
  userId: number,
  telegramData?: TelegramAuthData | undefined,
  ercWallets?: string[],
  tonWallets?: string[],
) {
  if (!telegramData && !ercWallets && !tonWallets) return;

  try {
    const queries: string[] = [];

    if (telegramData && telegramData.id) {
      queries.push(`
                 INSERT INTO "telegram_personal" 
                   ("user_id", "first_name", "last_name", "username", "chat_id")
                  VALUES (
                    ${userId}, 
                    '${telegramData.first_name}', 
                    '${telegramData.last_name || ''}',
                    '${telegramData.username || ''}',
                    '${telegramData.id}'
                    );
                `);
    }

    if (ercWallets && ercWallets.length > 0) {
      ercWallets.forEach((wallet) => {
        queries.push(`
          INSER INTO "wallets" 
               ("user_id", "wallet_address", "network_family_id")
             VALUES
        (${userId}, '${wallet}', 2) ON CONFLICT (wallet_address) DO NOTHING;`);
      });
    }

    if (tonWallets && tonWallets.length > 0) {
      tonWallets.forEach((wallet) => {
        queries.push(`
          INSER INTO "wallets" 
               ("user_id", "wallet_address", "network_family_id")
             VALUES
        (${userId}, '${wallet}', 1) ON CONFLICT (wallet_address) DO NOTHING;`);
      });
    }

    await massRunQueries(queries);
    return true;
  } catch (e) {
    console.log(e);
    return;
  }
}

export async function getUserId(telegramId?: string, wallet?: string): Promise<number | null> {
  if (!telegramId && !wallet) return null;

  const query = telegramId
    ? `
    SELECT id from "users" WHERE id IN (SELECT user_id FROM "telegram_personal" WHERE chat_id = '${telegramId}');
  `
    : `
    SELECT id from "users" WHERE id IN (SELECT user_id FROM "wallets" WHERE wallet = '${wallet}');
  `;
  const result = await runQuery(query, true);
  return !result ? null : result.length > 0 ? result[0].id : null;
}


export async function getUserData(telegramId?: string, wallet?: string): Promise<{
  id: number;
  username: string;
  inviter_id: number;
} | null> {
  if (!telegramId && !wallet) return null;

  const query = telegramId
    ? `
    SELECT id, role_id, username, inviter_id from "users" WHERE id IN (SELECT user_id FROM "telegram_personal" WHERE chat_id = '${telegramId}');
  `
    : `
    SELECT id from "users" WHERE id IN (SELECT user_id FROM "wallets" WHERE wallet = '${wallet}');
  `;
  const result = await runQuery(query, true);
  return !result ? null : result.length > 0 ? result[0] : null;
}

export async function getUserById(userId: number) {
  const query = `SELECT * FROM users WHERE "id" = ${userId};`;
  return (await runQuery(query, true)[0]) || null;
}

export async function getAuthData(userId: number) {
  const telegramQuery = `SELECT * FROM telegram_personal WHERE "user_id" = ${userId};`;
  const walletQuery = `SELECT * FROM wallets WHERE user_id = ${userId}`;
  return {
    telegram: (await runQuery(telegramQuery, true)[0]) || null,
    wallets: (await runQuery(walletQuery, true))
      ?.map((row) => {
        return row.wallet_address || null;
      })
      .filter((row) => {
        return row !== null;
      }),
  };
}

export async function setAdmin(userId) {
  const query = `UPDATE users SET user_role = 2 WHEREuser_id = ${userId};`;
  return await runQuery(query);
}

export async function dropAdmin(userId) {
  const query = `UPDATE users SET user_role = 1 WHEREuser_id = ${userId};`;
  return await runQuery(query);
}

export async function deleteUser(userId: number) {
  const queries = [
    `DELETE FROM users WHERE id = ${userId};`,
    `DELETE FROM telegram_personal WHERE user_id = ${userId};`,
    `DELETE FROM wallets WHERE user_id = ${userId}`,
  ];
  return await massRunQueries(queries);
}

export async function getUserWallets (userId: number): Promise<string[]> {
  const query = `SELECT wallet_address FROM wallets WHERE user_id = ${userId};`;
  const result = await runQuery(query, true);
  if (result) {
    return result.map((item) => {
      return String(item.wallet_address?.toLowerCase || "")
    })
  } else {
    return []
  }
}

export async function getUserTelegramChat(userId: number): Promise<string | null> {
  const query = `SELECT chat_id FROM "telegram_personal" WHERE user_id = ${userId};`;
  const result = await runQuery(query, true);
  if (result && result.length > 0) {
    return result[0].chat_id
  } else {
    return null
  }
}