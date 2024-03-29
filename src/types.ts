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
