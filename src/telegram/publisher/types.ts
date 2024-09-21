export type actions = 'start_post' | 'send_post' | 'confirm_post';

export type cmd = {name: string; description: string};

export const commands = [
    /\/start/, // List of commands
    /\/newpost/, // Start post creation
    /\/addkeyboard/, // Add buttons to post
    /\/confirmpost/, // Send post
]

export const menu: cmd[] = [
    {
        name: "/start",
        description: "Info"
    },
    {
        name: "/newpost",
        description: "Info"
    },
    {
        name: "/addkeyboard",
        description: "Info"
    },
    {
        name: "/confirmpost",
        description: "Info"
    }
]
