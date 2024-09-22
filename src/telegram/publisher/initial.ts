import TelegramBot from "node-telegram-bot-api";

export const publisher_api_token = process.env.TELEGRAM_PUBLISHER_API_TOKEN;
export const photoDirectory = "../../../downloads"

export const publisherBot = publisher_api_token? new TelegramBot(publisher_api_token || '', { polling: true }) : null;
