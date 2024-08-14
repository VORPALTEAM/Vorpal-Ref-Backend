import { authByTelegram } from '../controllers';
import { app } from '../server';

export function initTelegramRoutes() {
    app.post('/api/telegram/auth', authByTelegram);
}