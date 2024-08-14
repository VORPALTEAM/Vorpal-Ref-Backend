import { OldBot } from "./bot"
import { messages } from "./constants";


export function initOldBot () {
    if (!OldBot) {
        console.log("No old bot present");
        return;
    }
    console.log("Old bot notify started");
    OldBot?.on('message', (msg) => {
        OldBot?.sendMessage(msg.chat.id, messages.old);
    })
 }