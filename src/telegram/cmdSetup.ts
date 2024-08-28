import { Bot } from "./bot";

export function SetupBotMenuCommands () {
    try {
        Bot.setMyCommands([
            { command: '/start', description: 'Get started' },
            { command: '/duel', description: 'Create duel' },
            { command: '/referral', description: 'Referral info' },
            { command: '/reward', description: 'Daily reward' }
          ]);
        // console.log("Result: ", cmd)
    } catch (e: any) {
        console.log("Error: ", e.message)
    }
    
}
