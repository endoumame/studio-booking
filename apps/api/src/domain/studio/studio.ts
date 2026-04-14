import type { RoomId, StudioId } from "@my-app/shared";

import type { Address } from "../shared/address.js";
import type { CancellationPolicy } from "./cancellation-policy.js";
import type { Room } from "./room.js";

const MIN_NAME_LENGTH = 1;

interface StudioProps {
  studioId: StudioId;
  name: string;
  address: Address;
  rooms: Room[];
  cancellationPolicy: CancellationPolicy;
}

class Studio {
  readonly studioId: StudioId;
  readonly name: string;
  readonly address: Address;
  private readonly _rooms: Room[];
  readonly cancellationPolicy: CancellationPolicy;

  private constructor(props: StudioProps) {
    this.studioId = props.studioId;
    this.name = props.name;
    this.address = props.address;
    this._rooms = [...props.rooms];
    this.cancellationPolicy = props.cancellationPolicy;
  }

  static create(props: StudioProps): Studio {
    if (props.name.length < MIN_NAME_LENGTH) {
      throw new Error("Studio name must not be empty");
    }
    return new Studio(props);
  }

  get rooms(): readonly Room[] {
    return [...this._rooms];
  }

  addRoom(room: Room): void {
    const hasExisting = this._rooms.some((rm) => rm.roomId === room.roomId);
    if (hasExisting) {
      throw new Error(`Room with id ${room.roomId} already exists in studio`);
    }
    this._rooms.push(room);
  }

  removeRoom(roomId: RoomId): void {
    const index = this._rooms.findIndex((rm) => rm.roomId === roomId);
    const NOT_FOUND_INDEX = -1;
    if (index === NOT_FOUND_INDEX) {
      throw new Error(`Room with id ${roomId} not found in studio`);
    }
    const REMOVE_COUNT = 1;
    this._rooms.splice(index, REMOVE_COUNT);
  }

  findRoomById(roomId: RoomId): Room | undefined {
    return this._rooms.find((rm) => rm.roomId === roomId);
  }

  equals(other: Studio): boolean {
    return this.studioId === other.studioId;
  }
}

export type { StudioProps };
export { Studio };
