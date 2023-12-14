import { GameServer } from "./core/GameServer";

export async function InitGameIoServer() {

    const server = new GameServer();
    server.Start();

}