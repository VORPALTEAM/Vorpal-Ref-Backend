import {
  referralApiDefault,
  getLinksByOwnerResponse,
  getOwnerDataResponse,
  withdrawRewardAction,
} from '../controllers';
import { app } from '../server';

export function initReferralRoutes() {
  app.post('/api', referralApiDefault);

  app.get('/api/getlinksbyowner/:id', getLinksByOwnerResponse);

  app.get('/api/getownerdata/:id', getOwnerDataResponse);

  app.post('/api/withdraw', withdrawRewardAction);
}
