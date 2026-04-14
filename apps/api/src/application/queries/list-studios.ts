import type { RoomId, StudioId } from "@my-app/shared";
import { toRoomId, toStudioId } from "../../infrastructure/brand-helpers.js";

interface RoomDto {
  readonly roomId: RoomId;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

interface StudioDto {
  readonly studioId: StudioId;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
  readonly rooms: readonly RoomDto[];
}

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

const mapRoomRow = (row: RoomRow): RoomDto => ({
  capacity: row.capacity,
  hourlyRate: row.hourly_rate,
  name: row.name,
  roomId: toRoomId(row.room_id),
});

const mapStudioRow = (studioRow: StudioRow, roomRows: RoomRow[]): StudioDto => ({
  city: studioRow.city,
  name: studioRow.name,
  prefecture: studioRow.prefecture,
  rooms: roomRows.map((row) => mapRoomRow(row)),
  street: studioRow.street,
  studioId: toStudioId(studioRow.studio_id),
  zipCode: studioRow.zip_code,
});

const fetchStudios = async (db: D1Database): Promise<StudioRow[]> => {
  const result = await db.prepare("SELECT * FROM studios").all<StudioRow>();
  return result.results;
};

const fetchAllRooms = async (db: D1Database): Promise<RoomRow[]> => {
  const result = await db.prepare("SELECT * FROM rooms").all<RoomRow>();
  return result.results;
};

const listStudios = async (db: D1Database): Promise<StudioDto[]> => {
  const studios = await fetchStudios(db);
  const rooms = await fetchAllRooms(db);

  return studios.map((studio) => {
    const studioRooms = rooms.filter((room) => room.studio_id === studio.studio_id);
    return mapStudioRow(studio, studioRooms);
  });
};

export type { RoomDto, StudioDto };
export { listStudios };
