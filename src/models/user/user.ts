import { massRunQueries, runQuery } from '../connection';
import { TelegramAuthData, TelegramAuthNote } from '../../types';
import { decodeTgInitData } from '../../utils/auth';
import { generateWalletShortedName } from '../../utils/wallet';



export async function createUser(
  role = 'user',
  username?: string,
  inviterId?: number,
  telegramData?: TelegramAuthData,
  ercWallets?: string[],
  tonWallets?: string[],
): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const isUserExists = await checkIsUserExists(
      telegramData,
      ercWallets,
      tonWallets,
    );

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
           INSERT INTO "users" ("inviter_id", "username", "role")
           VALUES (${inviterId || null}, '${userName}', '${role}')
           RETURNING "id";
        `;

    const userCreation = await runQuery(creationQuery, true);

    if (!userCreation || userCreation.length === 0 || !userCreation[0].id) {
        reject("User creation result is invalid");
        return;
    }

    const userId = Number(userCreation[0]?.id);

    assignDataToUser(userId, telegramData, ercWallets, tonWallets);

    resolve(1);
  });
}

export async function checkIsUserExists(
  telegramData?: TelegramAuthData, // Use only one method, with priority
  ercWallets?: string[],
  tonWallets?: string[],
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let userCount = 0;
    const queries: string[] = [];

    if (!telegramData && !ercWallets && !tonWallets) {
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

    if (ercWallets && ercWallets.length > 0) {
      queries.push(`
                SELECT COUNT(*) from "users" 
                 WHERE "id" IN (SELECT "user_id" FROM "erc_wallets" 
                 WHERE "wallet_address" IN (${ercWallets
                   .map((wallet) => `'${wallet.toLowerCase()}'`)
                   .join(', ')});
              `);
    }

    if (tonWallets && tonWallets.length > 0) {
      queries.push(`
                SELECT COUNT(*) from "users" 
                 WHERE "id" IN (SELECT "user_id" FROM "erc_wallets" 
                 WHERE "wallet_address" IN (${tonWallets
                   .map((wallet) => `'${wallet.toLowerCase()}'`)
                   .join(', ')});
              `);
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
      queries.push(`
                INSER INTO "erc_wallets" 
                     ("user_id", "wallet_address")
                   VALUES
                   ${ercWallets
                     .map((wallet) => `(${userId}, '${wallet.toLowerCase()}')`)
                     .join(', ')}       
              ;`);
    }

    if (tonWallets && tonWallets.length > 0) {
      queries.push(`
                INSER INTO "erc_wallets" 
                     ("user_id", "wallet_address")
                   VALUES
                   ${tonWallets
                     .map((wallet) => `(${userId}, '${wallet.toLowerCase()}')`)
                     .join(', ')}       
              ;`);
    }

    await massRunQueries(queries);
    return true;
  } catch (e) {
    console.log(e);
    return;
  }
}

export async function updateUser() {}

export async function deleteUser() {}

export async function validateUser() {}

export async function getUserData() {}

export async function checkUserRole() {}
