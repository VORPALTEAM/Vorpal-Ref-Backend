import {
    isUserInDuelResponce,
    opponentResponce,
    duelDataResponce,
    duelDataByLoginResponce,
    onlineCountResponce,
    isNeedSubscribes,
    finishDuelResponce,
    duelDeletionResponce,
    updateOnlineCount,
    rewardConditionResponce,
    acceptDuelResponce,
  } from '../controllers';
  import { app } from '../server';
  
  export function initDuelRoutes() {
    app.get('/api/isinduel/:login', isUserInDuelResponce);
  
    app.get('/api/getopponent/:login', opponentResponce);
  
    app.get('/api/dueldata/:id', duelDataResponce);
  
    app.get('/api/dueldatabylogin/:login', duelDataByLoginResponce);
  
    app.get('/api/getduelid/:login', duelDataResponce);
  
    app.get('/api/onlinecount', onlineCountResponce);
  
    app.get('/api/usersubscribecondition', isNeedSubscribes);
  
    app.post('/api/finishduel', finishDuelResponce);
  
    app.post('/api/deleteduel', duelDeletionResponce);
  
    app.post('/api/updateonlinecount', updateOnlineCount);
  
    app.post('/api/rewardcondition', rewardConditionResponce);
  
    app.post('/api/duelrewardcondition', rewardConditionResponce);
  
    app.post('/api/duelaccept', acceptDuelResponce);
  }