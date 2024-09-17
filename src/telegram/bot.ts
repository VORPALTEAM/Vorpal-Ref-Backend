import { duelText, startText, tg_token, old_token } from './constants';
import TelegramBot from 'node-telegram-bot-api';

export const Bot = new TelegramBot(tg_token || "", { polling: true });

export const OldBot = old_token ? new TelegramBot(old_token || "", { polling: true }): null;