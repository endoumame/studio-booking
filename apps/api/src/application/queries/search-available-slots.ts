import { BookingStatus } from "@my-app/shared";
import type { RoomId } from "@my-app/shared";
import { toRoomId } from "../../infrastructure/brand-helpers.js";

const FIRST_HOUR = 0;
const LAST_HOUR = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

interface SearchAvailableSlotsInput {
  readonly roomId?: string;
  readonly date: string;
  readonly startHour?: number;
  readonly endHour?: number;
}

interface AvailableSlot {
  readonly roomId: RoomId;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
}

interface BookingRow {
  readonly room_id: string;
  readonly start_time: string;
  readonly end_time: string;
}

interface RoomRow {
  readonly room_id: string;
}

interface FindGapsInput {
  readonly roomId: RoomId;
  readonly bookings: BookingRow[];
  readonly windowStart: Date;
  readonly windowEnd: Date;
}

interface BuildSlotsInput {
  readonly roomIds: string[];
  readonly bookings: BookingRow[];
  readonly windowStart: Date;
  readonly windowEnd: Date;
}

const buildDateBounds = (
  date: string,
  startHour: number,
  endHour: number,
): { readonly windowStart: Date; readonly windowEnd: Date } => {
  const windowStart = new Date(`${date}T00:00:00.000Z`);
  windowStart.setUTCHours(startHour);
  const windowEnd = new Date(`${date}T00:00:00.000Z`);
  windowEnd.setUTCHours(endHour);
  return { windowEnd, windowStart };
};

const calculateDurationMinutes = (start: Date, end: Date): number =>
  (end.getTime() - start.getTime()) / MS_PER_MINUTE;

const buildSlot = (roomId: RoomId, slotStart: Date, slotEnd: Date): AvailableSlot => ({
  durationMinutes: calculateDurationMinutes(slotStart, slotEnd),
  endTime: slotEnd.toISOString(),
  roomId,
  startTime: slotStart.toISOString(),
});

interface TimeGap {
  readonly gapStart: Date;
  readonly gapEnd: Date;
}

const clampBooking = (
  booking: BookingRow,
  windowStart: Date,
  windowEnd: Date,
): { readonly effectiveStart: Date; readonly effectiveEnd: Date } => {
  const bookingStart = new Date(booking.start_time);
  const bookingEnd = new Date(booking.end_time);
  return {
    effectiveEnd: bookingEnd < windowEnd ? bookingEnd : windowEnd,
    effectiveStart: bookingStart > windowStart ? bookingStart : windowStart,
  };
};

const collectGaps = (sorted: BookingRow[], windowStart: Date, windowEnd: Date): TimeGap[] => {
  const gaps: TimeGap[] = [];
  let cursor = windowStart;

  for (const booking of sorted) {
    const { effectiveStart, effectiveEnd } = clampBooking(booking, windowStart, windowEnd);
    if (cursor < effectiveStart) {
      gaps.push({ gapEnd: effectiveStart, gapStart: cursor });
    }
    cursor = effectiveEnd > cursor ? effectiveEnd : cursor;
  }

  if (cursor < windowEnd) {
    gaps.push({ gapEnd: windowEnd, gapStart: cursor });
  }
  return gaps;
};

const findGapsForRoom = (input: FindGapsInput): AvailableSlot[] => {
  const { bookings, roomId, windowEnd, windowStart } = input;
  const sorted = [...bookings].toSorted(
    (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
  );

  const gaps = collectGaps(sorted, windowStart, windowEnd);
  return gaps
    .map((gap) => buildSlot(roomId, gap.gapStart, gap.gapEnd))
    .filter((slot) => slot.durationMinutes >= MINUTES_PER_HOUR);
};

const fetchRoomIds = async (db: D1Database, roomId?: string): Promise<string[]> => {
  if (typeof roomId === "string" && roomId !== "") {
    return [roomId];
  }
  const result = await db.prepare("SELECT room_id FROM rooms").all<RoomRow>();
  return result.results.map((row) => row.room_id);
};

interface FetchAllBookingsInput {
  readonly db: D1Database;
  readonly roomIds: string[];
  readonly dayStart: string;
  readonly dayEnd: string;
}

const fetchAllBookings = async (input: FetchAllBookingsInput): Promise<BookingRow[]> => {
  const placeholders = input.roomIds.map(() => "?").join(", ");
  const result = await input.db
    .prepare(
      `SELECT room_id, start_time, end_time FROM read_bookings WHERE room_id IN (${placeholders}) AND start_time < ? AND end_time > ? AND status NOT IN (?, ?)`,
    )
    .bind(
      ...input.roomIds,
      input.dayEnd,
      input.dayStart,
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    )
    .all<BookingRow>();
  return result.results;
};

const buildSlotsFromBookings = (input: BuildSlotsInput): AvailableSlot[] =>
  input.roomIds.flatMap((roomId) => {
    const roomBookings = input.bookings.filter((bk) => bk.room_id === roomId);
    return findGapsForRoom({
      bookings: roomBookings,
      roomId: toRoomId(roomId),
      windowEnd: input.windowEnd,
      windowStart: input.windowStart,
    });
  });

const searchAvailableSlots = async (
  input: SearchAvailableSlotsInput,
  db: D1Database,
): Promise<AvailableSlot[]> => {
  const startHour = input.startHour ?? FIRST_HOUR;
  const endHour = input.endHour ?? LAST_HOUR;
  const { windowStart, windowEnd } = buildDateBounds(input.date, startHour, endHour);
  const roomIds = await fetchRoomIds(db, input.roomId);
  const bookings = await fetchAllBookings({
    dayEnd: windowEnd.toISOString(),
    dayStart: windowStart.toISOString(),
    db,
    roomIds,
  });
  return buildSlotsFromBookings({ bookings, roomIds, windowEnd, windowStart });
};

export type { AvailableSlot, SearchAvailableSlotsInput };
export { searchAvailableSlots };
