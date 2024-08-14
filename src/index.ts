import dotEnv from 'dotenv';
import { telegramBotLaunch } from './telegram';
import { startWatchingTimer } from './blockchain/Stars/watcher';
import { apiVersion } from './config';
import { app } from './server';
import { initRoutes } from 'routes';


dotEnv.config();
const port = process.argv[2] ? process.argv[2] : process.env.DEFAULT_PORT;

initRoutes();

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

telegramBotLaunch();
startWatchingTimer();
