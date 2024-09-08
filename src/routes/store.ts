import {
  getStoreItemsResponse,
  balanceResponse,
  balanceAllResponse,
  checkAvailableResponse,
  buyResponse,
} from '../controllers';
import { app } from '../server';

export function initStoreRoutes() {
  app.get('/api/storeitems', getStoreItemsResponse);

  app.post('/api/store/userbalance', balanceResponse);

  app.post('/api/store/userbalanceall', balanceAllResponse);

  app.post('/api/store/isavailable', checkAvailableResponse);

  app.post('/api/store/buy', buyResponse);
}
