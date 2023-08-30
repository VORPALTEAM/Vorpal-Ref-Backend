import { coords } from '../types/gameplay';
import { play } from '../types';
import { GameRoom } from '../core/Room';

export default abstract class GameObject {
  protected id: string = '';
  protected isIdassigned: boolean;
  protected room : GameRoom;

  public rect: play.rect;
  public RoomAction: any;
  public owner: string;
  public class: string;

  constructor(
    _room: GameRoom,
    _owner: string,
    _coords: play.coords,
    _sprite: play.sprite,
    _class: string,
  ) {
    this.room = _room;
    this.owner = _owner;
    this.rect = {
      ..._coords,
      ..._sprite,
    };
    this.class = _class;
  }

  public assignId(_id: string): boolean {
    if (!this.isIdassigned) {
      this.id = _id;
      this.isIdassigned = true;
      return true;
    } else {
      return false;
    }
  }

  public getId(): string {
    return this.id;
  }

  public center(): coords {
    return {
      x: this.rect.x + this.rect.width / 2,
      y: this.rect.y + this.rect.height / 2,
    };
  }

  abstract destroy: () => void;
}