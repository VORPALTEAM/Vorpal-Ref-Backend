import { adminSesionLifetime } from "../../config";

export const sessions = new Map<number, AdminSession>();

export class AdminSession {
    userId: number;
    lastAction: string;
    liveTimer: NodeJS.Timeout;

    public textPost?: string;
    public photoPost?: { img: string, text?: string};
    public videoPost?: { img: string, text?: string}
    public postKeyboard?: any;

    constructor(
        userId: number
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

export function getAdminSession (userId: number): AdminSession {
    return sessions.get(userId) ||(() => {
        const newSession = new AdminSession(userId);
        sessions.set(userId, newSession);
        return newSession;
    })();
}