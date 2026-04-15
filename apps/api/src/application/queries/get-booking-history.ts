import type { DomainError } from "../../domain/shared/errors.js";
import type { MemberId } from "@my-app/shared";
import type { Result } from "neverthrow";
import { ok } from "neverthrow";

interface BookingHistoryRow {
  readonly booking_id: string;
  readonly member_id: string;
  readonly room_id: string;
  readonly status: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly total_amount: number;
  readonly payment_method: string | null;
  readonly payment_status: string | null;
  readonly created_at: string;
}

interface BookingHistoryItem {
  readonly bookingId: string;
  readonly roomId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly paymentMethod: string | null;
  readonly paymentStatus: string | null;
  readonly createdAt: string;
}

interface GetBookingHistoryInput {
  readonly memberId: MemberId;
}

const mapRowToItem = (row: BookingHistoryRow): BookingHistoryItem => ({
  bookingId: row.booking_id,
  createdAt: row.created_at,
  endTime: row.end_time,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  roomId: row.room_id,
  startTime: row.start_time,
  status: row.status,
  totalAmount: row.total_amount,
});

const getBookingHistoryQuery = async (
  db: D1Database,
  input: GetBookingHistoryInput,
): Promise<Result<readonly BookingHistoryItem[], DomainError>> => {
  const result = await db
    .prepare(
      "SELECT booking_id, member_id, room_id, status, start_time, end_time, total_amount, payment_method, payment_status, created_at FROM read_bookings WHERE member_id = ? ORDER BY created_at DESC",
    )
    .bind(input.memberId)
    .all<BookingHistoryRow>();

  return ok(result.results.map(mapRowToItem));
};

export { getBookingHistoryQuery };
export type { BookingHistoryItem, GetBookingHistoryInput };
