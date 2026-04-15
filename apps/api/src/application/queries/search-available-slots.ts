import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Result } from "neverthrow";
import type { RoomId } from "@my-app/shared";
import { validation } from "../../domain/shared/errors.js";

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const MIN_DATE_LENGTH = 0;

interface AvailableSlot {
  readonly roomId: RoomId;
  readonly startTime: string;
  readonly endTime: string;
}

interface SearchAvailableSlotsInput {
  readonly roomId: RoomId;
  readonly date: string;
}

interface BookingRow {
  readonly room_id: string;
  readonly start_time: string;
  readonly end_time: string;
}

interface FindGapsContext {
  readonly rows: readonly BookingRow[];
  readonly roomId: RoomId;
  readonly dayBounds: { dayStart: Date; dayEnd: Date };
}

const buildDayBounds = (date: string): { dayStart: Date; dayEnd: Date } => {
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(dayStart.getTime() + HOURS_PER_DAY * MINUTES_PER_HOUR * MS_PER_MINUTE);
  return { dayEnd, dayStart };
};

const queryBookingsForDay = async (
  db: D1Database,
  input: SearchAvailableSlotsInput,
): Promise<readonly BookingRow[]> => {
  const { dayEnd, dayStart } = buildDayBounds(input.date);
  const result = await db
    .prepare(
      "SELECT room_id, start_time, end_time FROM read_bookings WHERE room_id = ? AND start_time < ? AND end_time > ? AND status NOT IN ('CANCELLED') ORDER BY start_time ASC",
    )
    .bind(input.roomId, dayEnd.toISOString(), dayStart.toISOString())
    .all<BookingRow>();
  return result.results;
};

const buildSlot = (roomId: RoomId, cursor: Date, boundary: Date): AvailableSlot => ({
  endTime: boundary.toISOString(),
  roomId,
  startTime: cursor.toISOString(),
});

const processBookingRow = (
  context: FindGapsContext,
  state: { cursor: Date; slots: AvailableSlot[] },
  row: BookingRow,
): void => {
  const bookingStart = new Date(row.start_time);
  if (state.cursor < bookingStart) {
    state.slots.push(buildSlot(context.roomId, state.cursor, bookingStart));
  }
  const bookingEnd = new Date(row.end_time);
  state.cursor = bookingEnd > state.cursor ? bookingEnd : state.cursor;
};

const findGaps = (context: FindGapsContext): readonly AvailableSlot[] => {
  const state = { cursor: context.dayBounds.dayStart, slots: [] as AvailableSlot[] };

  for (const row of context.rows) {
    processBookingRow(context, state, row);
  }

  if (state.cursor < context.dayBounds.dayEnd) {
    state.slots.push(buildSlot(context.roomId, state.cursor, context.dayBounds.dayEnd));
  }

  return state.slots;
};

const searchAvailableSlotsQuery = async (
  db: D1Database,
  input: SearchAvailableSlotsInput,
): Promise<Result<readonly AvailableSlot[], DomainError>> => {
  if (!input.date || input.date.trim().length === MIN_DATE_LENGTH) {
    return err(validation("Date is required"));
  }

  const rows = await queryBookingsForDay(db, input);
  const dayBounds = buildDayBounds(input.date);

  return ok(findGaps({ dayBounds, roomId: input.roomId, rows }));
};

export { searchAvailableSlotsQuery };
export type { AvailableSlot, SearchAvailableSlotsInput };
