import {
    createBox,
    openBoxRequest,
    getBoxOpenResultResponse,
    getUserAvailableBoxes,
    giveResourcesResponse,
    getUserResources,
  } from '../controllers';
  import { app } from '../server';
  
  export function initRewardRoutes() {
    app.post('/api/boxes/create', createBox);
  
    app.post('/api/boxes/open', openBoxRequest);
  
    app.post('/api/boxes/openresult', getBoxOpenResultResponse);
  
    app.post('/api/boxes/available', getUserAvailableBoxes);
  
    app.post('/api/boxes/assets/give', giveResourcesResponse);
  
    app.post('/api/boxes/assets', getUserResources);
  }