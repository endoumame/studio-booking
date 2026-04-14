import { BookingStatus } from "@my-app/shared";
import type { RoomId } from "@my-app/shared";
import { toRoomId } from "../../infrastructure/brand-helpers.js";

const HOURS_IN_DAY = 24;
const NO_BOOKINGS = 0;

interface GetRoomStatusInput {
  readonly studioId: string;
  readonly date: string;
}

interface RoomStatusBooking {
  readonly startTime: string;
  readonly endTime: string;
  readonly status: BookingStatus;
}

type RoomAvailability = "available" | "occupied" | "upcoming";

interface RoomStatus {
  readonly roomId: RoomId;
  readonly roomName: string;
  readonly availability: RoomAvailability;
  readonly bookings: readonly RoomStatusBooking[];
}

interface RoomRow {
  readonly room_id: string;
  readonly name: string;
}

interface BookingRow {
  readonly room_id: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly status: string;
}

const buildDayBounds = (date: string): { readonly dayStart: string; readonly dayEnd: string } => {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T00:00:00.000Z`);
  dayEnd.setUTCHours(HOURS_IN_DAY);
  return { dayEnd: dayEnd.toISOString(), dayStart: dayStart.toISOString() };
};

const determineAvailability = (bookings: BookingRow[], now: Date): RoomAvailability => {
  if (bookings.length === NO_BOOKINGS) {
    return "available";
  }

  const hasOccupied = bookings.some((booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return (
      start <= now &&
      now < end &&
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.COMPLETED
    );
  });

  if (hasOccupied) {
    return "occupied";
  }

  const hasUpcoming = bookings.some((booking) => {
    const start = new Date(booking.start_time);
    return (
      start > now &&
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.COMPLETED
    );
  });

  return hasUpcoming ? "upcoming" : "available";
};

const mapBookingRows = (bookings: BookingRow[]): RoomStatusBooking[] =>
  bookings
    .filter(
      (booking) =>
        booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.COMPLETED,
    )
    .map((booking) => ({
      endTime: booking.end_time,
      startTime: booking.start_time,
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      status: booking.status as BookingStatus,
    }));

const fetchRooms = async (db: D1Database, studioId: string): Promise<RoomRow[]> => {
  const result = await db
    .prepare("SELECT room_id, name FROM rooms WHERE studio_id = ?")
    .bind(studioId)
    .all<RoomRow>();
  return result.results;
};

interface FetchBookingsForDateInput {
  readonly db: D1Database;
  readonly roomIds: readonly string[];
  readonly dayStart: string;
  readonly dayEnd: string;
}

const fetchBookingsForDate = async (input: FetchBookingsForDateInput): Promise<BookingRow[]> => {
  if (input.roomIds.length === NO_BOOKINGS) {
    return [];
  }
  const placeholders = input.roomIds.map(() => "?").join(", ");
  const result = await input.db
    .prepare(
      `SELECT room_id, start_time, end_time, status FROM read_bookings WHERE room_id IN (${placeholders}) AND start_time < ? AND end_time > ?`,
    )
    .bind(...input.roomIds, input.dayEnd, input.dayStart)
    .all<BookingRow>();
  return result.results;
};

const buildRoomStatus = (room: RoomRow, roomBookings: BookingRow[], now: Date): RoomStatus => ({
  availability: determineAvailability(roomBookings, now),
  bookings: mapBookingRows(roomBookings),
  roomId: toRoomId(room.room_id),
  roomName: room.name,
});

const getRoomStatus = async (input: GetRoomStatusInput, db: D1Database): Promise<RoomStatus[]> => {
  const { dayStart, dayEnd } = buildDayBounds(input.date);
  const rooms = await fetchRooms(db, input.studioId);
  const roomIds = rooms.map((rm) => rm.room_id);
  const bookings = await fetchBookingsForDate({ dayEnd, dayStart, db, roomIds });
  const now = new Date();

  return rooms.map((room) => {
    const roomBookings = bookings.filter((bk) => bk.room_id === room.room_id);
    return buildRoomStatus(room, roomBookings, now);
  });
};

export type { GetRoomStatusInput, RoomAvailability, RoomStatus, RoomStatusBooking };
export { getRoomStatus };
