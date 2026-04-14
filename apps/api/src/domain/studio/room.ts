import type { Equipment } from "./equipment.js";
import type { Money } from "../shared/money.js";
import type { RoomId } from "@my-app/shared";

const MIN_NAME_LENGTH = 1;
const MIN_CAPACITY = 1;

interface RoomProps {
  roomId: RoomId;
  name: string;
  capacity: number;
  hourlyRate: Money;
  equipment: Equipment[];
}

class Room {
  readonly roomId: RoomId;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: Money;
  readonly equipment: readonly Equipment[];

  private constructor(props: RoomProps) {
    this.roomId = props.roomId;
    this.name = props.name;
    this.capacity = props.capacity;
    this.hourlyRate = props.hourlyRate;
    this.equipment = [...props.equipment];
  }

  static create(props: RoomProps): Room {
    if (props.name.length < MIN_NAME_LENGTH) {
      throw new Error("Room name must not be empty");
    }
    if (!Number.isInteger(props.capacity) || props.capacity < MIN_CAPACITY) {
      throw new RangeError("Room capacity must be a positive integer");
    }
    return new Room(props);
  }

  calculateCost(durationHours: number): Money {
    return this.hourlyRate.multiply(durationHours);
  }

  equals(other: Room): boolean {
    return this.roomId === other.roomId;
  }
}

export type { RoomProps };
export { Room };
