import type {
  BandId,
  BookingId,
  BookingStatus,
  MemberId,
  PaymentMethod,
  PaymentStatus,
  RoomId,
} from "@my-app/shared";
import {
  toBandIdOrNull,
  toBookingId,
  toMemberId,
  toRoomId,
} from "../../infrastructure/brand-helpers.js";

interface GetBookingDetailInput {
  readonly bookingId: string;
}

interface BookingDetail {
  readonly bookingId: BookingId;
  readonly memberId: MemberId;
  readonly bandId: BandId | null;
  readonly roomId: RoomId;
  readonly status: BookingStatus;
  readonly startTime: string;
  readonly endTime: string;
  readonly totalAmount: number;
  readonly paymentMethod: PaymentMethod | null;
  readonly paymentStatus: PaymentStatus | null;
  readonly createdAt: string;
  readonly updatedAt: string;
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
  readonly payment_method: string | null;
  readonly payment_status: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

const mapRowToDetail = (row: BookingRow): BookingDetail => ({
  bandId: toBandIdOrNull(row.band_id),
  bookingId: toBookingId(row.booking_id),
  createdAt: row.created_at,
  endTime: row.end_time,
  memberId: toMemberId(row.member_id),
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  paymentMethod: row.payment_method as PaymentMethod | null,
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  paymentStatus: row.payment_status as PaymentStatus | null,
  roomId: toRoomId(row.room_id),
  startTime: row.start_time,
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  status: row.status as BookingStatus,
  totalAmount: row.total_amount,
  updatedAt: row.updated_at,
});

const getBookingDetail = async (
  input: GetBookingDetailInput,
  db: D1Database,
): Promise<BookingDetail | null> => {
  const row = await db
    .prepare("SELECT * FROM read_bookings WHERE booking_id = ?")
    .bind(input.bookingId)
    .first<BookingRow>();

  return row ? mapRowToDetail(row) : null;
};

export type { BookingDetail, GetBookingDetailInput };
export { getBookingDetail };
