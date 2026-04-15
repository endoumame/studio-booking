import type { DomainError } from "../../domain/shared/errors.js";
import type { Result } from "neverthrow";
import type { StudioId } from "@my-app/shared";
import { ok } from "neverthrow";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const EMPTY_LENGTH = 0;

interface RoomRow {
  readonly room_id: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourly_rate: number;
}

interface RoomBookingRow {
  readonly room_id: string;
  readonly booking_id: string;
  readonly status: string;
  readonly start_time: string;
  readonly end_time: string;
}

interface RoomStatusItem {
  readonly roomId: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
  readonly bookings: readonly RoomBookingInfo[];
}

interface RoomBookingInfo {
  readonly bookingId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
}

interface GetRoomStatusInput {
  readonly studioId: StudioId;
  readonly date: string;
}

interface RoomBookingQueryParams {
  readonly db: D1Database;
  readonly roomIds: readonly string[];
  readonly dayRange: { dayStart: string; dayEnd: string };
}

const buildDayRange = (date: string): { dayStart: string; dayEnd: string } => {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(start.getTime() + HOURS_PER_DAY * MINUTES_PER_HOUR * MS_PER_MINUTE);
  return { dayEnd: end.toISOString(), dayStart: start.toISOString() };
};

const queryRooms = async (db: D1Database, studioId: StudioId): Promise<readonly RoomRow[]> => {
  const result = await db
    .prepare("SELECT room_id, name, capacity, hourly_rate FROM rooms WHERE studio_id = ?")
    .bind(studioId)
    .all<RoomRow>();
  return result.results;
};

const queryRoomBookings = async (
  params: RoomBookingQueryParams,
): Promise<readonly RoomBookingRow[]> => {
  if (params.roomIds.length === EMPTY_LENGTH) {
    return [];
  }

  const placeholders = params.roomIds.map(() => "?").join(", ");
  const sql = `SELECT room_id, booking_id, status, start_time, end_time FROM read_bookings WHERE room_id IN (${placeholders}) AND start_time < ? AND end_time > ? AND status NOT IN ('CANCELLED') ORDER BY start_time ASC`;
  const bindings = [...params.roomIds, params.dayRange.dayEnd, params.dayRange.dayStart];
  const result = await params.db
    .prepare(sql)
    .bind(...bindings)
    .all<RoomBookingRow>();
  return result.results;
};

const groupBookingsByRoom = (
  bookings: readonly RoomBookingRow[],
): ReadonlyMap<string, readonly RoomBookingInfo[]> => {
  const grouped = new Map<string, RoomBookingInfo[]>();
  for (const row of bookings) {
    const list = grouped.get(row.room_id) ?? [];
    list.push({
      bookingId: row.booking_id,
      endTime: row.end_time,
      startTime: row.start_time,
      status: row.status,
    });
    grouped.set(row.room_id, list);
  }
  return grouped;
};

const EMPTY_BOOKINGS: readonly RoomBookingInfo[] = [];

const buildRoomStatus = (
  rooms: readonly RoomRow[],
  bookingMap: ReadonlyMap<string, readonly RoomBookingInfo[]>,
): readonly RoomStatusItem[] =>
  rooms.map((room) => ({
    bookings: bookingMap.get(room.room_id) ?? EMPTY_BOOKINGS,
    capacity: room.capacity,
    hourlyRate: room.hourly_rate,
    name: room.name,
    roomId: room.room_id,
  }));

const getRoomStatusQuery = async (
  db: D1Database,
  input: GetRoomStatusInput,
): Promise<Result<readonly RoomStatusItem[], DomainError>> => {
  const rooms = await queryRooms(db, input.studioId);
  const roomIds = rooms.map((room) => room.room_id);
  const dayRange = buildDayRange(input.date);
  const bookings = await queryRoomBookings({ dayRange, db, roomIds });
  const bookingMap = groupBookingsByRoom(bookings);

  return ok(buildRoomStatus(rooms, bookingMap));
};

export { getRoomStatusQuery };
export type { GetRoomStatusInput, RoomBookingInfo, RoomStatusItem };
