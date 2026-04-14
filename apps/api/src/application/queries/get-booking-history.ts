import type {
  BandId,
  BookingId,
  BookingStatus,
  MemberId,
  PaymentStatus,
  RoomId,
} from "@my-app/shared";
import { toBandIdOrNull, toBookingId, toRoomId } from "../../infrastructure/brand-helpers.js";

interface GetBookingHistoryInput {
  readonly memberId: string;
}

interface BookingSummary {
  readonly bookingId: BookingId;
  readonly memberId: MemberId;
  readonly bandId: BandId | null;
  readonly roomId: RoomId;
  readonly status: BookingStatus;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly paymentStatus: PaymentStatus | null;
  readonly createdAt: string;
}

interface BookingRow {
  readonly booking_id: string;
  readonly member_id: string;
  readonly band_id: string | null;
  readonly room_id: string;
  readonly status: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly total_amount: number;
  readonly payment_status: string | null;
  readonly created_at: string;
}

const mapRowToSummary = (row: BookingRow, memberId: MemberId): BookingSummary => ({
  bandId: toBandIdOrNull(row.band_id),
  bookingId: toBookingId(row.booking_id),
  createdAt: row.created_at,
  endTime: row.end_time,
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  memberId,
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  paymentStatus: row.payment_status as PaymentStatus | null,
  roomId: toRoomId(row.room_id),
  startTime: row.start_time,
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  status: row.status as BookingStatus,
  totalAmount: row.total_amount,
});

const getBookingHistory = async (
  input: GetBookingHistoryInput,
  db: D1Database,
): Promise<BookingSummary[]> => {
  const result = await db
    .prepare(
      "SELECT booking_id, member_id, band_id, room_id, status, start_time, end_time, total_amount, payment_status, created_at FROM read_bookings WHERE member_id = ? ORDER BY created_at DESC",
    )
    .bind(input.memberId)
    .all<BookingRow>();

  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const memberId = input.memberId as MemberId;
  return result.results.map((row) => mapRowToSummary(row, memberId));
};

export type { BookingSummary, GetBookingHistoryInput };
export { getBookingHistory };
