import TelegramBot from 'node-telegram-bot-api';
import {
  massSendMediaThroughQueue,
  massSendMessageThroughQueue,
  sendMediaWithSave,
  sendMessageWithSave,
} from '../../handlers/utils';
import { adminCmdPreprocess } from '../functions';
import { publisherBot } from '../initial';
import { getAdminSession } from '../session';
import { Bot } from '../../bot';
import { getTournamentAnnounceChats } from '../../../models/tournament';

export const startAction = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;
  sendMessageWithSave(publisherBot, chat, `Choose /newpost to start posting`);
  const session = getAdminSession(chat);
};

export const newPostAction = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;
  const session = getAdminSession(chat);
  session.activeAction = "post";
  session.setLastAction('init_post');
  session.textPost = undefined;
  session.mediaPost = undefined;
  session.postKeyboard = undefined;
  sendMessageWithSave(
    publisherBot,
    chat,
    `All right, a new post. Enter a post conent below:`,
  );
};

export const addKeyboardAction = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;
  const session = getAdminSession(chat);
  if (!session.textPost && !session.mediaPost) {
    sendMessageWithSave(
      publisherBot,
      chat,
      `Please, enter the post content at first`,
    );
    return;
  }
  sendMessageWithSave(
    publisherBot,
    chat,
    `Enter message with name and url with space as a Link https://site.com`,
  );
  session.setLastAction('enter_keyboard');
};

export const confirmPostAction = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;
  const session = getAdminSession(chat);
  console.log('Session info: ', session.textPost, session.mediaPost);
  if (!session.textPost && !session.mediaPost) {
    sendMessageWithSave(publisherBot, chat, `Please, create post at first`);
    return;
  }
  if (session.getLastAction() === "tournament_announce_entry") {
    if (!session.tournamentId || !session.mediaPost) {
        sendMessageWithSave(publisherBot, chat, "Tournament id or media not setup");
        return;
    }
    const chats = await getTournamentAnnounceChats(session.tournamentId);
    console.log("chats to send: ", chats, session.mediaPost.text);
    for (let j = 0; j < chats.length; j++) {
      try {
        sendMediaWithSave(
          Bot, 
          Number(chats[j].chat_id), 
          session.mediaPost?.img || '', 
          session.mediaPost.text || '',
          session.mediaPost.type,
          false,
          {
            parse_mode: 'HTML',
            reply_markup:  {
                  inline_keyboard: [[
                    {
                      text: "Register",
                      callback_data: `tourtakepart${session.tournamentId}`
                    }
                  ]]
                },
          })
      } catch (e) {
        console.log("Sending error: ", e);
      }

    }
    return;
  }
  session.setLastAction('init');
  sendMessageWithSave(publisherBot, chat, `Message sending started`);
  if (session.mediaPost) {
    massSendMediaThroughQueue(
      Bot,
      session.mediaPost?.img || '',
      session.mediaPost?.text || '',
      session.mediaPost.type,
      {
        parse_mode: 'HTML',
        reply_markup: session.postKeyboard
          ? {
              inline_keyboard: session.postKeyboard,
            }
          : undefined,
      },
    );
    return;
  }
  if (session.textPost) {
    massSendMessageThroughQueue(Bot, session.textPost || '', {
      parse_mode: 'HTML',
      reply_markup: session.postKeyboard
        ? {
            inline_keyboard: session.postKeyboard,
          }
        : undefined,
    });
    return;
  }
};

export const cancelPostAction = async (msg: TelegramBot.Message) => {
  if (!publisherBot) return;
  const chat = await adminCmdPreprocess(publisherBot, msg);
  if (!chat) return;
  const session = getAdminSession(chat);
  session.setLastAction('init');
  session.textPost = undefined;
  session.mediaPost = undefined;
  session.postKeyboard = undefined;
  sendMessageWithSave(publisherBot, chat, `Post creation cancelled`);
};
