import {
  addStats,
  getStatsByDuel,
  getStatsByPalyer,
  getSAggregateStatsByPalyer,
} from '../controllers';
import { app } from '../server';

export function initStatsRoutes() {
  app.post('/api/duel/stats/add', addStats);

  app.get('/api/duel/stats/duel/:duelId', getStatsByDuel);

  app.get('/api/duel/stats/player/:player', getStatsByPalyer);

  app.get('/api/duel/stats/summary/:player', getSAggregateStatsByPalyer);
}
