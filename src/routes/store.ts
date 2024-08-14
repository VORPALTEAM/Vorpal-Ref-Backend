import {
  getStoreItemsResponce,
  balanceResponce,
  balanceAllResponce,
  checkAvailableResponce,
  buyResponce,
} from '../controllers';
import { app } from '../server';

export function initStoreRoutes() {
  app.get('/api/storeitems', getStoreItemsResponce);

  app.post('/api/store/userbalance', balanceResponce);

  app.post('/api/store/userbalanceall', balanceAllResponce);

  app.post('/api/store/isavailable', checkAvailableResponce);

  app.post('/api/store/buy', buyResponce);
}
