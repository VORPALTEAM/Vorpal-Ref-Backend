import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import axios from 'axios';
import {
  massSendMediaThroughQueue,
  massSendMessageThroughQueue,
  massSendPhotoThroughQueue,
  sendMessageWithSave,
  sendPhotoWithSave,
} from '../handlers/utils';
import { getUserData } from '../../models/user';
import { getAdminSession } from './session';
import { commands, menu } from './types';
import { notABusyRegex } from '../../utils/text';
import { adminCmdPreprocess, setupBotMenu } from './functions';
import { Bot } from '../../telegram/bot';
import { photoDirectory, publisherBot, publisher_api_token } from './initial';
import { mediaHandler } from './handlers/mediaHandler';
import { textHandler } from './handlers/textHandler';
import { TelegramMediaType } from 'types';
import * as actions from './commands';
import { callbackHandler } from './handlers';

const mediaTypes: TelegramMediaType[] = [
  'photo',
  'video',
  'audio',
  'document',
  'voice',
  'animation',
];

export function initPublisherBot() {
  if (!fs.existsSync(photoDirectory)) {
    fs.mkdirSync(photoDirectory, { recursive: true });
  }

  console.log('Publisher started');
  if (!publisherBot) return;
  setupBotMenu(publisherBot, menu);
  if (!publisherBot) return;

/*
  export const commands = [
    /\/start/, // List of commands
    /\/newpost/, // Start post creation
    /\/addkeyboard/, // Add buttons to post
    /\/confirmpost/, // Send post
    /\/cancelpost/,
    /\/newtournament/,
    /\/confirmtournament/,
    /\/canceltournament/,
    /\/tournaments/,
] */

  publisherBot.onText(/\/start/, actions.startAction);
  publisherBot.onText(/\/newpost/, actions.newPostAction);
  publisherBot.onText(/\/addkeyboard/, actions.addKeyboardAction);
  publisherBot.onText(/\/confirmpost/, actions.confirmPostAction);
  publisherBot.onText(/\/cancelpost/, actions.cancelPostAction);
  publisherBot.onText(/\/newtournament/, actions.newTournamentAction);
  publisherBot.onText(/\/announcetournament/, actions.announceTournamentAction);
  publisherBot.onText(/\/confirmtournament/, actions.confirmTournamentAction);
  publisherBot.onText(/\/canceltournament/, actions.cancelTournamentAction);
  publisherBot.onText(/\/tournaments/, actions.listOfTournamentsAction);

  publisherBot.on('callback_query', callbackHandler);


  publisherBot.on('message', async (msg) => {
    await textHandler(msg);
  });

  mediaTypes.forEach((type) => {
    if (!publisherBot) return;
    publisherBot.on(type, async (msg) => {
      await mediaHandler(msg, type);
    });
  });
}
