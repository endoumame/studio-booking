import type { EquipmentId, RoomId, StudioId } from "@my-app/shared";
import type { DomainError } from "../shared/errors.js";
import type { Equipment } from "./equipment.js";
import type { Result } from "neverthrow";
import type { Room } from "./room.js";
import type { Studio } from "./studio.js";

interface StudioRepository {
  readonly findById: (studioId: StudioId) => Promise<Result<Studio | null, DomainError>>;
  readonly findRoomById: (roomId: RoomId) => Promise<Result<Room | null, DomainError>>;
  readonly findEquipmentById: (
    equipmentId: EquipmentId,
  ) => Promise<Result<Equipment | null, DomainError>>;
  readonly save: (studio: Studio) => Promise<Result<null, DomainError>>;
}

export type { StudioRepository };
