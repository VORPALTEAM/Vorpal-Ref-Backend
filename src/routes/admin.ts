import {
  getProjectData,
  adminDataRequest,
  adminSaveData,
  getAdminUserData,
  adminUpdateUserData,
  createDuelByAdmin,
  acceptDuelByAdmin,
} from '../controllers';
import { app } from '../server';

export function initAdminRoutes() {
  app.get('/api/public/:project', getProjectData);

  app.post('/api/admin/requestdata', adminDataRequest);

  app.post('/api/admin/savedata', adminSaveData);

  app.post('/api/admin/getusers', getAdminUserData);

  app.post('/api/admin/updateusers', adminUpdateUserData);

  app.post('/api/admin/createduel', createDuelByAdmin);

  app.post('/api/admin/acceptduel', acceptDuelByAdmin);
}
