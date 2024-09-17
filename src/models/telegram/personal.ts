import { runQuery as Q } from '../connection';
import { TelegramAuthData, TelegramAuthNote, tgUserTxnData } from '../../types';
import { createUser, getUserData } from '../../models/user';

export async function setPersonalData(
  data: TelegramAuthData,
  inviter?: string
): Promise<Boolean> {
  return new Promise(async (resolve, reject) => {
    const fd: TelegramAuthData = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name || '',
      username: data.username?.toLowerCase() || '',
      auth_date: data.auth_date || 0,
      hash: data.hash || '',
    };

    const user = await getUserData (String(fd.id));
    const isInvitedByExternal = !isNaN(Number(inviter)) && Number(inviter) < 0;
    const inviterId = isInvitedByExternal ? Number(inviter) : Number((await getUserData (inviter))?.id);
    const username = fd.username || fd.first_name || "Anonimous";
    
    if (!user) {
      const userId = await createUser("1", username, inviterId || undefined, fd);
      return userId;
    }

   return user?.id
  });
}

export async function getPersonalDataById(
  userId: number,
): Promise<TelegramAuthNote | null> {
  return new Promise(async (resolve, reject) => {
    const query = `
        SELECT "user_id", "first_name", "last_name", "username", "chat_id"
        FROM "telegram_personal" WHERE "user_id" = '${userId}';
        `;
    const result = await Q(query);
    resolve(result && result.length > 0 ? {
      id: Number(result[0].user_id),
      first_name: result[0].first_name,
      last_name: result[0].last_name,
      username: result[0].username,
      chat_id: Number(result[0].chat_id || 0)
    } : null);
    return;
  });
}

export async function getPersonalDataByUsername(
  username: string,
): Promise<TelegramAuthNote | null> {
  return new Promise(async (resolve, reject) => {
    const query = `
          SELECT "user_id", "first_name", "last_name", "username", "chat_id"
          FROM "telegram_personal" WHERE "username" = '${username}';
          `;
          const result = await Q(query);
          resolve(result && result.length > 0 ? {
            id: Number(result[0].user_id),
            first_name: result[0].first_name,
            last_name: result[0].last_name,
            username: result[0].username,
            chat_id: result[0].chat_id || 0
          } : null);
          return;
  });
}

export async function getUserTransactions (login: string) {
  const query = `SELECT * FROM "resource_txn_log" WHERE "userlogin" = '${login.toLowerCase()}' ORDER BY "time" DESC;`;
  const txns = await Q(query);
  return txns && txns.length > 0 ? txns : []
}
