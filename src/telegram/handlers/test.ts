import { Bot } from '../bot';

export async function testStartHandler (Bot, msg) {
    try {
      console.log("Test handler");
      await Bot.sendMessage(msg.chat.id, `Received: ${msg.text}`);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };