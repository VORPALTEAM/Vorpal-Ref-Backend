import {
    isUserInDuelResponse,
    opponentResponse,
    duelDataResponse,
    duelDataByLoginResponse,
    onlineCountResponse,
    isNeedSubscribes,
    finishDuelResponse,
    duelDeletionResponse,
    updateOnlineCount,
    rewardConditionResponse,
    acceptDuelResponse,
    duelCountResponse,
  } from '../controllers';
  import { app } from '../server';
  
  export function initDuelRoutes() {
    app.get('/api/isinduel/:login', isUserInDuelResponse);
  
    app.get('/api/getopponent/:login', opponentResponse);
  
    app.get('/api/dueldata/:id', duelDataResponse);
  
    app.get('/api/dueldatabylogin/:login', duelDataByLoginResponse);
  
    app.get('/api/getduelid/:login', duelDataResponse);
  
    app.get('/api/onlinecount', onlineCountResponse);
  
    app.get('/api/usersubscribecondition', isNeedSubscribes);
  
    app.post('/api/finishduel', finishDuelResponse);
  
    app.post('/api/deleteduel', duelDeletionResponse);
  
    app.post('/api/updateonlinecount', updateOnlineCount);
  
    app.post('/api/rewardcondition', rewardConditionResponse);
  
    app.post('/api/duelrewardcondition', rewardConditionResponse);
  
    app.post('/api/duelaccept', acceptDuelResponse);

    app.get('/api/duelusercount/:id', duelCountResponse)
  }