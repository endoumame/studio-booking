import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Equipment } from "./equipment.js";
import type { Money } from "../shared/money.js";
import type { Result } from "neverthrow";
import type { RoomId } from "@my-app/shared";
import { multiplyMoney } from "../shared/money.js";
import { validation } from "../shared/errors.js";

const MIN_NAME_LENGTH = 0;
const MIN_CAPACITY = 1;

interface Room {
  readonly roomId: RoomId;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: Money;
  readonly equipment: readonly Equipment[];
}

interface CreateRoomProps {
  readonly roomId: RoomId;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: Money;
  readonly equipment: readonly Equipment[];
}

const validateRoomName = (name: string): Result<string, DomainError> => {
  if (name.trim().length === MIN_NAME_LENGTH) {
    return err(validation("Room name must not be empty"));
  }
  return ok(name.trim());
};

const validateRoomCapacity = (capacity: number): Result<number, DomainError> => {
  if (!Number.isInteger(capacity) || capacity < MIN_CAPACITY) {
    return err(validation("Room capacity must be a positive integer"));
  }
  return ok(capacity);
};

const createRoom = (props: CreateRoomProps): Result<Room, DomainError> =>
  validateRoomName(props.name).andThen((name) =>
    validateRoomCapacity(props.capacity).map((capacity) => ({
      capacity,
      equipment: [...props.equipment],
      hourlyRate: props.hourlyRate,
      name,
      roomId: props.roomId,
    })),
  );

const calculateRoomCost = (room: Room, hours: number): Money =>
  multiplyMoney(room.hourlyRate, hours);

export { calculateRoomCost, createRoom };
export type { CreateRoomProps, Room };
