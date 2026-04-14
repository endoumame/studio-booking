import type { EquipmentId, RoomId, StudioId } from "@my-app/shared";

import type { Equipment } from "./equipment.js";
import type { Room } from "./room.js";
import type { Studio } from "./studio.js";

interface StudioRepository {
  save(studio: Studio): Promise<void>;
  findById(id: StudioId): Promise<Studio | null>;
  findRoomById(id: RoomId): Promise<Room | null>;
  findEquipmentById(id: EquipmentId): Promise<Equipment | null>;
}

export type { StudioRepository };
