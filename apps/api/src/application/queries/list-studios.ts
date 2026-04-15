import type { DomainError } from "../../domain/shared/errors.js";
import type { Result } from "neverthrow";
import { ok } from "neverthrow";

interface StudioRow {
  readonly studio_id: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zip_code: string;
}

interface RoomRow {
  readonly room_id: string;
  readonly studio_id: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourly_rate: number;
}

interface StudioRoomItem {
  readonly roomId: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

interface StudioListItem {
  readonly studioId: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
  readonly rooms: readonly StudioRoomItem[];
}

const queryAllStudios = async (db: D1Database): Promise<readonly StudioRow[]> => {
  const result = await db
    .prepare(
      "SELECT studio_id, name, prefecture, city, street, zip_code FROM studios ORDER BY name ASC",
    )
    .all<StudioRow>();
  return result.results;
};

const queryAllRooms = async (db: D1Database): Promise<readonly RoomRow[]> => {
  const result = await db
    .prepare("SELECT room_id, studio_id, name, capacity, hourly_rate FROM rooms ORDER BY name ASC")
    .all<RoomRow>();
  return result.results;
};

const groupRoomsByStudio = (
  rooms: readonly RoomRow[],
): ReadonlyMap<string, readonly StudioRoomItem[]> => {
  const grouped = new Map<string, StudioRoomItem[]>();
  for (const room of rooms) {
    const list = grouped.get(room.studio_id) ?? [];
    list.push({
      capacity: room.capacity,
      hourlyRate: room.hourly_rate,
      name: room.name,
      roomId: room.room_id,
    });
    grouped.set(room.studio_id, list);
  }
  return grouped;
};

const EMPTY_ROOMS: readonly StudioRoomItem[] = [];

const mapStudioRow = (
  row: StudioRow,
  roomMap: ReadonlyMap<string, readonly StudioRoomItem[]>,
): StudioListItem => ({
  city: row.city,
  name: row.name,
  prefecture: row.prefecture,
  rooms: roomMap.get(row.studio_id) ?? EMPTY_ROOMS,
  street: row.street,
  studioId: row.studio_id,
  zipCode: row.zip_code,
});

const listStudiosQuery = async (
  db: D1Database,
): Promise<Result<readonly StudioListItem[], DomainError>> => {
  const studios = await queryAllStudios(db);
  const rooms = await queryAllRooms(db);
  const roomMap = groupRoomsByStudio(rooms);

  return ok(studios.map((studio) => mapStudioRow(studio, roomMap)));
};

export { listStudiosQuery };
export type { StudioListItem, StudioRoomItem };
