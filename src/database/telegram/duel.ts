import { duel_lifetime } from '../../config';
import { DuelInfo } from '../../types';
import { GetValueByKey, SetValueByKey } from '../balances';

const { connection } = require('../connection');
const md5 = require('md5');
const onlineCountKey = 'DUEL_ONLINE_COUNT';

export async function SetOnlineCount(count: number) {
  await SetValueByKey(onlineCountKey, count);
  return true;
}

export async function GetOnlineCount() {
  return await GetValueByKey(onlineCountKey);
}

export async function AddDuelOpponent(duelId: string, login: string) {
  const query = `UPDATE "duels" SET "login2" = '${login.toLowerCase()}' WHERE "duel_id" = '${duelId}';`;
  try {
    const result = await connection.query(query);
    return true;
  } catch (e) {
    return false;
  }
}

export async function GetDuelPairCount(part1: string, part2: string) {
  const login1 = part1.toLowerCase();
  const login2 = part2.toLowerCase();
  const query = `SELECT * FROM "duels" WHERE (login1 = '${login1}' AND login2 = '${login2}') OR (login1 = '${login2}' AND login2 = '${login1}');`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return result.rows.length;
    } else {
      return 0;
    }
  } catch (e) {
    return 0;
  }
}

export async function IsUserInDuel(user: string) {
  const login = user.toLowerCase();
  const query = `SELECT "duel_id", "creation", "login1", "login2" FROM "duels" WHERE ("login1" = '${login}' OR "login2" = '${login}') AND isfinished = false;`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      const duelRow = result.rows[0];
      const timeS = Math.round(new Date().getTime() / 1000);
      const duelTime = Number(duelRow.creation);
      if (timeS - duelTime > duel_lifetime) {
        await FinishDuel(duelRow.duel_id, "");
        return null;
      }
      if (!duelRow.login1 || !duelRow.login2) {
        return null;
      }
      return duelRow.duel_id;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function GetDuelData(duelId: string): Promise<DuelInfo | null> {
  const query = `SELECT "login1", "login2", "creation", "isfinished", "winner" FROM "duels" WHERE "duel_id" = '${duelId}';`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function GetOpponent(login: string) {
  const query = `SELECT "login2" FROM "duels" WHERE "isfinished" = false AND "login1" = '${login.toLowerCase()}';`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return result.rows[0].login2;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}


export async function RemoveDuelOpponent(login: string) {
  const findDuelQuery = `SELECT "duel_id", "login1" FROM "duels" WHERE "isfinished" = false AND "login2" = '${login.toLowerCase()}';`;
  let duelId = "";
  try {
    const result = await connection.query(findDuelQuery);
    if (result.rows.length > 0) {
      duelId= result.rows[0].duel_id;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e.message)
    return false;
  }
  const removeSelfQuery = `UPDATE "duels" SET "login2" = '' WHERE "duel_id" = '${duelId}';`;
  try {
    await connection.query(removeSelfQuery);
    return true;
  } catch (e) {
    console.log(e.message)
    return false;
  }
}

export async function GetDuelDataByUser(
  login: string,
): Promise<DuelInfo | null> {
  const filteredLogin = login.toLowerCase();
  const query = `SELECT "duel_id", "login1", "login2", "creation", "isfinished", "winner" FROM "duels" 
  WHERE "login1" = '${filteredLogin}' OR "login2" = '${filteredLogin}' ORDER BY "creation" DESC LIMIT 1;`;

  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function GetDuelDataByInviter(
  login: string,
): Promise<DuelInfo | null> {
  const filteredLogin = login.toLowerCase();
  const query = `SELECT "duel_id", "login1", "login2", "creation", "isfinished", "winner" FROM "duels" 
  WHERE "login1" = '${filteredLogin}' ORDER BY "creation" DESC LIMIT 1;`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function FinishDuel(duelId: string, winner: string) {
  console.log("Finish duel called")
  const filteredLogin = winner.toLowerCase();
  const query = `UPDATE "duels" SET isfinished = true, isexpired = true, winner = '${filteredLogin}' WHERE "duel_id" = '${duelId}';`;
  try {
    const result = await connection.query(query);
    if (result.rows.length > 0) {
      return true;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function DeleteDuel(duelId: string) {
  const query = `DELETE FROM "duels" WHERE "duel_id" = '${duelId}';`;
  console.log("Delete duel called")
  try {
    const result = await connection.query(query);
    return true;
  } catch (e) {
    console.log('Duel deletion error: ', e.message);
    return false;
  }
}

export async function CreateDuel(login1: string, login2: string = '') {
  const fLogin1 = login1.toLowerCase();
  const fLogin2 = login2.toLowerCase();
  if (!fLogin1) {
      console.log("Try to create duel without inviter");
      return null;
  }
  const dt = Math.round(new Date().getTime() / 1000);
  const duel_id = md5(`${dt}_${fLogin1}_${fLogin2}`);
  const query = `INSERT INTO "duels" 
    ("duel_id", "login1", "login2", "creation", "isfinished", "isexpired", "winner") 
    VALUES ('${duel_id}', '${fLogin1}', '${fLogin2}', ${dt}, false, false, '');`;
  try {
    const result = await connection.query(query);
    return duel_id;
  } catch (e) {
    console.log('Duel creation error', e.message);
    return null;
  }
  return;
}
