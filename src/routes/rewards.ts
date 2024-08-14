import {
    createBox,
    openBoxRequest,
    getBoxOpenResultResponce,
    getUserAvailableBoxes,
    giveResourcesResponce,
    getUserResources,
  } from '../controllers';
  import { app } from '../server';
  
  export function initRewardRoutes() {
    app.post('/api/boxes/create', createBox);
  
    app.post('/api/boxes/open', openBoxRequest);
  
    app.post('/api/boxes/openresult', getBoxOpenResultResponce);
  
    app.post('/api/boxes/available', getUserAvailableBoxes);
  
    app.post('/api/boxes/assets/give', giveResourcesResponce);
  
    app.post('/api/boxes/assets', getUserResources);
  }