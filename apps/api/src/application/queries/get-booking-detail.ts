import { err, ok } from "neverthrow";
import type { BookingId } from "@my-app/shared";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Result } from "neverthrow";
import { notFound } from "../../domain/shared/errors.js";

interface BookingDetailRow {
  readonly booking_id: string;
  readonly member_id: string;
  readonly band_id: string | null;
  readonly room_id: string;
  readonly status: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly total_amount: number;
  readonly payment_method: string | null;
  readonly payment_status: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

interface BookingDetail {
  readonly bookingId: string;
  readonly memberId: string;
  readonly bandId: string | null;
  readonly roomId: string;
  readonly status: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly paymentMethod: string | null;
  readonly paymentStatus: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface GetBookingDetailInput {
  readonly bookingId: BookingId;
}

const mapRowToDetail = (row: BookingDetailRow): BookingDetail => ({
  bandId: row.band_id,
  bookingId: row.booking_id,
  createdAt: row.created_at,
  endTime: row.end_time,
  memberId: row.member_id,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  roomId: row.room_id,
  startTime: row.start_time,
  status: row.status,
  totalAmount: row.total_amount,
  updatedAt: row.updated_at,
});

const getBookingDetailQuery = async (
  db: D1Database,
  input: GetBookingDetailInput,
): Promise<Result<BookingDetail, DomainError>> => {
  const result = await db
    .prepare(
      "SELECT booking_id, member_id, band_id, room_id, status, start_time, end_time, total_amount, payment_method, payment_status, created_at, updated_at FROM read_bookings WHERE booking_id = ?",
    )
    .bind(input.bookingId)
    .first<BookingDetailRow>();

  if (result === null) {
    return err(notFound("Booking not found"));
  }

  return ok(mapRowToDetail(result));
};

export { getBookingDetailQuery };
export type { BookingDetail, GetBookingDetailInput };
