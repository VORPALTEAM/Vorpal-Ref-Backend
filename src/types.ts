export type GameResult = {
  date: number;
  playerOne: string;
  playerTwo: string;
  winner: 1 | 2;
  star_id_one: number;
  star_id_two: number;
  planet_id_one: number;
  planet_id_two: number;
};

export type PlayerStats = {
  address: string;
  games: number;
  wins: number;
};

export type ResponseObject = {
  success: boolean;
  message: string;
};

export type Race = 'Waters' | 'Humans' | 'Insects' | 'Lizards';

export type Coords = {
  X: number;
  Y: number;
  Z: number;
};

export type StarParams = {
  id?: number; // Auto increment
  owner?: string;
  name: string;
  isLive: boolean;
  creation: number; // timestamp
  updated: number;
  level: number;
  fuel: number;
  levelUpFuel: number;
  fuelSpendings: number; // per hour
  habitableZoneMin: number;
  habitableZoneMax: number;
  planetSlots: number;
  mass: number;
  race: Race;
  coords: Coords;
};

export type StarData = {
  id: number;
  owner: string;
  params: StarParams;
};

export type StarList = StarData[];
export type boxOpenResults =
  | 'laser1'
  | 'laser2'
  | 'laser3'
  | 'spore'
  | 'spice'
  | 'metal'
  | 'biomass'
  | 'carbon'
  | 'token';

export interface TelegramAuthDataNoHash {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  auth_date: number;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  auth_date?: number;
  hash?: string;
}

export interface ReferralStatsData {
  id: number;
  to: string;
  for: string;
  resource: string;
  amount: number;
  level: number;
  date: number;
}

export interface TelegramAuthNote extends TelegramAuthData {
  chat_id: number;
}

export interface DuelInfo {
  id: number;
  id1: number;
  id2?: number;
  nickName1?: string;
  nickName2?: string;
  creation: number;
  is_finished?: string;
  is_started?: string;
  winner?: string;
}

export interface tgChannelData {
  username: string;
  name: string;
  id: number;
}

export interface StoreItem {
  id?: number;
  name: string;
  type?: string;
  rareness?: string;
  description?: string;
  img_preview?: string;
  img_full?: string;
  per_user: number | null;
  total_count: number | null;
  cost?: number;
  currency_id?: string;
}

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

export interface storeItemBalance {
  id: number;
  user_name: string;
  item_id: number;
  balance: number;
}

export interface uniqueItem {
  item_id: string;
  item_img?: string;
  item_name: string;
  item_type?: string;
  price?: number;
  currency?: string;
  owner?: string;
}

export interface watchingChannel {
  channel_name: string;
  channel_username: string;
  channel_id: string;
}

export interface tgUserTxnData {
  id: number;
  userlogin: string;
  time: string;
  resource: string;
  amount: number;
  reason: string;
}

export interface DuelPlayerStats {
  id?: number;
  duel_id: string;
  player: string;
  damage_total: number;
  experience: number;
  gold: number;
}

export interface PlayerSummaryStats {
  player: string;
  total_damage: number;
  total_experience: number;
  total_gold: number;
}


export type TGInitData = {
    query_id: string,
    auth_date: number,
    hash: string,
    user: {
        id: number,
        first_name: string,
        last_name?: string,
        username?: string,
        language_code: string,
        is_premium: boolean,
        allows_write_to_pm: boolean
    }
}

export type TelegramMediaType = "audio" | "video" | "photo" | "animation" | "document" | "voice"
