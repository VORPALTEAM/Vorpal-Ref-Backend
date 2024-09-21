import { adminSesionLifetime } from "../../config";

export const sessions = new Map<string, AdminSession>();

export class AdminSession {
    userId: string;
    lastAction: string;
    liveTimer: NodeJS.Timeout;

    constructor(
        userId: string
    ){
        this.userId = userId;
        this.lastAction = "init";
        this.liveTimer = setTimeout(() => {
            this.destroy();
        }, adminSesionLifetime);
    } 

    setLastAction(action: string) {
        if (this.liveTimer) {
            clearTimeout(this.liveTimer);
        }
        this.liveTimer = setTimeout(() => {
            this.destroy();
        }, adminSesionLifetime)
        this.lastAction = action;
    }

    getLastAction() {
        return this.lastAction;
    }

    destroy() {
        sessions.delete(this.userId);
    } 
}

export function getAdminSession (userId: string): AdminSession {
    return sessions.get(userId) ||(() => {
        const newSession = new AdminSession(userId);
        sessions.set(userId, newSession);
        return newSession;
    })();
}