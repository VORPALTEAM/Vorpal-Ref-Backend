import { runQuery as Q } from '../connection';
import { tgChannelData } from '../../types';

export async function addChannelToWatching(channelData: tgChannelData) {
  const query = `
    INSERT INTO "watching_tg_subscriptions" ("channel_name", "channel_username", "channel_id")
    VALUES ('${channelData.name}', '${channelData.username}', '${channelData.id}');`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function deleteChannelFromWatching(userName: string) {
  const query = `DELETE FROM "watching_tg_subscriptions" WHERE "channel_username" = '${userName}';`;
  const result = await Q(query, false);
  return result ? true : false;
}

export async function getWatchingChannels(): Promise<tgChannelData[]> {
  const query = `SELECT "channel_name", "channel_username", "channel_id" FROM "watching_tg_subscriptions";`;
  const result = await Q(query);
  return result ? result.map((row) => {
    const ch: tgChannelData = {
      name: row.channel_name,
      username: row.channel_username,
      id: Number(row.channel_id),
    };
    return ch;
  }) : []
}
