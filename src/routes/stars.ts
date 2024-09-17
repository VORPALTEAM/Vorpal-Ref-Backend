import {
    getAllStars,
    getWeb2StarList,
    updateAllStars,
    updateOneStar,
  } from '../controllers';
  import { app } from '../server';
  
  export function initStarsRoutes() {
    app.get('/api/getstarlist', getAllStars);
  
    app.get('/api/getserverstarlist', getWeb2StarList);
  
    app.post('/api/updatestars', updateAllStars);
  
    app.post('/api/updateonestar/:id', updateOneStar);
  }