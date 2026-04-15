import { BookingStatus, PaymentMethod, PaymentStatus } from "@my-app/shared";
import type {
  BookingStatusType,
  PaymentMethodType,
  PaymentStatusType,
  RoomId,
} from "@my-app/shared";
import { err, ok } from "neverthrow";
import { toBandId, toBookingId, toMemberId, toPaymentId, toRoomId } from "../brand-helpers.js";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Result } from "neverthrow";
import type { TimeSlot } from "../../domain/shared/time-slot.js";
import { appendEvents } from "../event-store.js";
import { conflict } from "../../domain/shared/errors.js";

const STREAM_TYPE = "Booking";
const INITIAL_VERSION = 0;
const EXCLUDED_STATUSES = [BookingStatus.CANCELLED, BookingStatus.COMPLETED];

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
}

interface UpsertParams {
  readonly db: D1Database;
  readonly booking: Booking;
}

const UPSERT_SQL = `INSERT INTO read_bookings (booking_id, member_id, band_id, room_id, status, start_time, end_time, total_amount, payment_method, payment_status, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(booking_id) DO UPDATE SET status=?, start_time=?, end_time=?, total_amount=?, payment_method=?, payment_status=?, updated_at=?`;

const buildUpsertBindings = (booking: Booking): readonly unknown[] => {
  const now = new Date().toISOString();
  const start = booking.timeSlot.startTime.toISOString();
  const end = booking.timeSlot.endTime.toISOString();
  return [
    booking.bookingId,
    booking.memberId,
    booking.bandId,
    booking.roomId,
    booking.status,
    start,
    end,
    booking.totalAmount.amount,
    booking.payment.method,
    booking.payment.status,
    booking.createdAt.toISOString(),
    now,
    booking.status,
    start,
    end,
    booking.totalAmount.amount,
    booking.payment.method,
    booking.payment.status,
    now,
  ];
};

const upsertReadModel = async (params: UpsertParams): Promise<void> => {
  const bindings = buildUpsertBindings(params.booking);
  await params.db
    .prepare(UPSERT_SQL)
    .bind(...bindings)
    .run();
};

interface SaveParams {
  readonly db: D1Database;
  readonly booking: Booking;
  readonly events: readonly DomainEvent[];
}

const saveBooking = async (params: SaveParams): Promise<Result<null, DomainError>> => {
  try {
    const appendResult = await appendEvents(params.db, {
      events: params.events,
      expectedVersion: INITIAL_VERSION,
      streamId: params.booking.bookingId,
      streamType: STREAM_TYPE,
    });
    if (appendResult.isErr()) {
      return appendResult;
    }
    await upsertReadModel({ booking: params.booking, db: params.db });
    return ok(null);
  } catch {
    return err(conflict("Failed to save booking"));
  }
};

const mapRowToBooking = (row: BookingRow): Booking => ({
  addedEquipment: [],
  bandId: row.band_id === null ? null : toBandId(row.band_id),
  bookingId: toBookingId(row.booking_id),
  createdAt: new Date(row.created_at),
  extensionRequest: null,
  memberId: toMemberId(row.member_id),
  payment: {
    amount: { amount: row.total_amount, currency: "JPY" },
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    method: (row.payment_method ?? PaymentMethod.ON_SITE_CASH) as PaymentMethodType,
    paidAt: null,
    paymentId: toPaymentId(row.booking_id),
    pointsUsed: { value: 0 },
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    status: (row.payment_status ?? PaymentStatus.PENDING) as PaymentStatusType,
  },
  roomId: toRoomId(row.room_id),
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  status: row.status as BookingStatusType,
  timeSlot: {
    endTime: new Date(row.end_time),
    startTime: new Date(row.start_time),
  },
  totalAmount: { amount: row.total_amount, currency: "JPY" },
});

const FIND_BY_ID_SQL = "SELECT * FROM read_bookings WHERE booking_id = ?";

const findBookingById = async (
  db: D1Database,
  id: string,
): Promise<Result<Booking | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_BY_ID_SQL).bind(id).first<BookingRow>();
    return ok(row === null ? null : mapRowToBooking(row));
  } catch {
    return err(conflict("Failed to find booking"));
  }
};

const FIND_BY_MEMBER_SQL = "SELECT * FROM read_bookings WHERE member_id = ?";

const findBookingsByMemberId = async (
  db: D1Database,
  memberId: string,
): Promise<Result<readonly Booking[], DomainError>> => {
  try {
    const result = await db.prepare(FIND_BY_MEMBER_SQL).bind(memberId).all<BookingRow>();
    return ok(result.results.map(mapRowToBooking));
  } catch {
    return err(conflict("Failed to find bookings by member"));
  }
};

const FIND_OVERLAPPING_SQL = `SELECT * FROM read_bookings WHERE room_id = ? AND start_time < ? AND end_time > ? AND status NOT IN (?, ?)`;

interface FindOverlappingParams {
  readonly db: D1Database;
  readonly roomId: RoomId;
  readonly timeSlot: TimeSlot;
}

const findOverlappingBookings = async (
  params: FindOverlappingParams,
): Promise<Result<readonly Booking[], DomainError>> => {
  try {
    const endIso = params.timeSlot.endTime.toISOString();
    const startIso = params.timeSlot.startTime.toISOString();
    const result = await params.db
      .prepare(FIND_OVERLAPPING_SQL)
      .bind(params.roomId, endIso, startIso, ...EXCLUDED_STATUSES)
      .all<BookingRow>();
    return ok(result.results.map(mapRowToBooking));
  } catch {
    return err(conflict("Failed to find overlapping bookings"));
  }
};

const createD1BookingRepository = (db: D1Database): BookingRepository => ({
  findById: async (id): Promise<Result<Booking | null, DomainError>> => {
    const result = await findBookingById(db, id);
    return result;
  },
  findByMemberId: async (memberId): Promise<Result<readonly Booking[], DomainError>> => {
    const result = await findBookingsByMemberId(db, memberId);
    return result;
  },
  findOverlapping: async (roomId, timeSlot): Promise<Result<readonly Booking[], DomainError>> => {
    const result = await findOverlappingBookings({ db, roomId, timeSlot });
    return result;
  },
  save: async (booking, events): Promise<Result<null, DomainError>> => {
    const result = await saveBooking({ booking, db, events });
    return result;
  },
});

export { createD1BookingRepository };
