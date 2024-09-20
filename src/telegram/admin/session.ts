

const adminSesionLifetime = 3600000;
const queueMessageSendingInterval = 500;

export const sessions = new Map<string, AdminSession>();

export class AdminSession {
    userId: string;
    lastAction: string;

    constructor(
        userId: string
    ){
        this.userId = userId;
    } 

    setLastAction(action: string) {
        this.lastAction = action;
    }

    getLastAction() {
        return this.lastAction;
    }
}

export function getAdminSession (userId: string): AdminSession {
    return sessions.get(userId) ||(() => {
        const newSession = new AdminSession(userId);
        sessions.set(userId, newSession);
        return newSession;
    })();
}