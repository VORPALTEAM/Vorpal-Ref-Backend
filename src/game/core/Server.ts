import WebSocket, { Server } from 'ws';
import Web3 from 'web3';
import {
  FrameInterval,
  default_ws_port,
  gameTimerValue,
  pingPongDelay,
  signTimeout,
} from '../config';
import { WriteLog } from '../../database/log';
import { PlayerState } from '../types';
import { Player, PlayerRow, RoomEvent } from '../types/interfaces';
import { GameRoom } from './Room';
import { PackTitle } from '../types/Messages';

const web3 = new Web3(Web3.givenProvider);

export class GameIoServer {
  private players: PlayerRow[] = [];
  private Rooms: GameRoom[] = [];
  private ws_port = Number(
    process.env.WS_PORT ? process.env.WS_PORT : default_ws_port,
  );
  // private wss = new WebSocket.Server({ port: this.ws_port });
  private timer: any;
  private generator: any;
  private playerDefaultState: PlayerState = {
    auth: true,
    inLookingFor: false,
    inGame: false,
    starId: -1,
    planetId: -1,
    roomId: -1,
  };
  private AuthRequestMsg = { action: 'auth', state: 'requesting' };

  private GenerateId(): string {
    return String(Math.round(Math.random() * 1000000000));
  }

  private AuthMsg(): string {
    const dt = new Date().getTime();
    return 'auth_' + String(dt - (dt % 600000));
  }

  private SelectIndexes(max: number): number[] {
    const indexes: number[] = [];
    const indexOne = Math.floor(Math.random() * (max + 1));
    indexes.push(indexOne);
    while (true) {
      const indexTwo = Math.floor(Math.random() * (max + 1));
      if (indexTwo !== indexOne) {
        indexes.push(indexTwo);
        break;
      }
    }
    return indexes;
  }

  private GetPlayerByParam(param: WebSocket | string): PlayerRow | null {
    let result: PlayerRow | null = null;

    this.players.forEach((player) => {
      if (
        player.id === param ||
        player.ws === param ||
        player.publicKey === param
      ) {
        result = player;
      }
    });
    return result;
  }

  public UpdatePlayerState(id: string, state: PlayerState) {
    const newPlayerList: PlayerRow[] = [];
    this.players.forEach((player) => {
      if (player.id !== id) {
        newPlayerList.push(player);
      } else {
        newPlayerList.push({
          id: player.id,
          ws: player.ws,
          publicKey: player.publicKey,
          state: state,
        });
      }
    });
    this.players = newPlayerList;
  }

  public InsertPlayer(player: Player): boolean {
    try {
      this.players.push({
        id: player.id,
        ws: player.ws,
        publicKey: player.publicKey,
        state: this.playerDefaultState,
      });
      return true;
    } catch (e: any) {
      WriteLog('0x998', 'Error : ' + e.message);
      return false;
    }
  }

  public DeletePlayer(id: string) {
    const newPlayerList: PlayerRow[] = [];
    this.players.forEach((player) => {
      if (player.id !== id) {
        newPlayerList.push(player);
      }
    });
    this.players = newPlayerList;
  }

  private RoomGenerator() {
    return setInterval(() => {
      const availablePlayers = this.players.filter((player) => {
        return player.state.inLookingFor;
      });

      if (availablePlayers.length > 1) {
        const indexPair = this.SelectIndexes(availablePlayers.length - 1);
        if (indexPair.length > 1) {
          // WriteLog('0x0169', 'Room generation started : ' + String(indexPair));

          const playerOne: PlayerRow = availablePlayers[indexPair[0]];
          const playerTwo: PlayerRow = availablePlayers[indexPair[1]];
          const players = [playerOne, playerTwo];
          
          try {
            const room = new GameRoom(this, players);
            room.SetId(this.Rooms.length);
            this.Rooms.push(room);
  
            WriteLog('Room creation : ', 'Room created, id : ' + room.GetId());
            room.Start();
          } catch(e) {
            WriteLog('Room creation error: ', e.message);
          }          
        }
      }
    }, gameTimerValue);
  }

  public EmitRoomEvent(event: RoomEvent) {
    return;
  }

  public Start() {
    const wss = new WebSocket.Server({ port: this.ws_port });
    wss.on('connection', (ws: WebSocket) => {
      const cId = this.GenerateId();
      const authTimer = setTimeout(() => {
        if (!this.GetPlayerByParam(ws)) {
          ws.send(
            JSON.stringify({
              action: 'unauth',
              message: 'Auth time expired',
            }),
          );
          ws.close();
        }
      }, signTimeout);
      // WriteLog('0x0032', 'New connection, id : ' + cId);
      ws.send(JSON.stringify(this.AuthRequestMsg));
      ws.on('message', (message: string) => {
        if (String(message) === 'ping') {
          ws.send('pong');
          return;
        }
        // WriteLog('0x0033', 'Received : ' + message);
        let msg: any;
        try {
          msg = JSON.parse(message);
        } catch (e) {
          return;
        }
        switch (msg.action) {
          case PackTitle.ping:
            ws.send(
              JSON.stringify({
                action: PackTitle.pong,
              }),
            );
            break;
          case PackTitle.auth:
            if (!msg.signature) return;
            try {
              const recoverMsg = this.AuthMsg();
              const publicKey = web3.eth.accounts
                .recover(recoverMsg, msg.signature)
                .toLowerCase();
              this.players.forEach((player) => {
                if (player.publicKey === publicKey) {
                  ws.send(
                    JSON.stringify({
                      action: PackTitle.unauth,
                      message:
                        'Auth failed, player with this key is already online',
                    }),
                  );
                  return;
                }
              });
              clearInterval(authTimer);
              const inserted = this.InsertPlayer({
                id: cId,
                ws: ws,
                publicKey: publicKey,
              });
              ws.send(
                JSON.stringify({
                  action: PackTitle.auth,
                  state: 'success',
                  playerId: publicKey,
                }),
              );
            } catch (e: any) {
              WriteLog('0x0089', e.message);
            }
            break;
          case PackTitle.entergame:
            const player = this.GetPlayerByParam(ws);
            WriteLog('0x005', 'Player : ' + JSON.stringify(player));
            if (player) {
              if (player.state.inLookingFor || player.state.inGame) {
                ws.send(
                  JSON.stringify({
                    action: PackTitle.entergame,
                    status: 'failed',
                  }),
                );
                return;
              }
              const playerNewState: PlayerState = {
                auth: true,
                inLookingFor: true,
                inGame: false,
                starId: player.state.starId,
                planetId: player.state.planetId,
                roomId: -1,
              };
              this.UpdatePlayerState(player.id, playerNewState);
              WriteLog(player.publicKey, 'Now in game : ' + player.id);
              ws.send(
                JSON.stringify({
                  action: PackTitle.entergame,
                  state: 'success',
                  message: 'Player now in queue',
                  playerId: player.publicKey,
                }),
              );
            }
            break;
          case PackTitle.withdrawgame:
            const playerW = this.GetPlayerByParam(ws);
            if (playerW) {
              const playerNewState: PlayerState = {
                auth: true,
                inLookingFor: false,
                inGame: playerW.state.inGame,
                starId: playerW.state.starId,
                planetId: playerW.state.planetId,
                roomId: playerW.state.roomId,
              };
              this.UpdatePlayerState(playerW.id, playerNewState);
              ws.send(
                JSON.stringify({
                  action: PackTitle.withdrawgame,
                  state: 'success',
                  message: 'Player now removed from queue',
                  playerId: playerW.publicKey,
                }),
              );
            }
            break;
          default:
            return;
        }
      });
      ws.on('close', () => {
        const player = this.GetPlayerByParam(ws);
        if (player && player.state.roomId > -1) {
          this.Rooms[player.state.roomId].EmitUserEvent({
            userPublicKey: player.publicKey,
            type: 'close',
            data: [],
          });
        }
        this.DeletePlayer(cId);
      });
    });
    this.generator = this.RoomGenerator();

    this.timer = setInterval(() => {
        try {
          this.Rooms.forEach((room) => {
            room.FrameUpdate();
          })
        } catch (e) {
          WriteLog('error', e.message);
        }
      }, FrameInterval);

  }

  public Finish() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.generator) {
      clearInterval(this.generator);
    }
    return true;
  }
}
