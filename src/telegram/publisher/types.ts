export type actions = 'start_post' | 'send_post' | 'confirm_post';

export type cmd = {name: string; description: string};

export const commands = [
    /\/start/, // List of commands
    /\/newpost/, // Start post creation
    /\/addkeyboard/, // Add buttons to post
    /\/confirmpost/, // Send post
    /\/cancelpost/
]

export const menu: cmd[] = [
    {
        name: "/start",
        description: "Info"
    },
    {
        name: "/newpost",
        description: "New post"
    },
    {
        name: "/addkeyboard",
        description: "Add keyboard to post"
    },
    {
        name: "/confirmpost",
        description: "Send post"
    },
    {
        name: "/cancelpost",
        description: "Cancel post sending"
    }
]
