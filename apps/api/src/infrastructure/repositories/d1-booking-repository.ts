import type { BookingId, MemberId, RoomId } from "@my-app/shared";
import { BookingStatus, PaymentMethod, PaymentStatus } from "@my-app/shared";
import {
  toBandIdOrNull,
  toBookingId,
  toMemberId,
  toPaymentId,
  toRoomId,
} from "../brand-helpers.js";
import { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import { EventStore } from "../event-store/event-store.js";
import { Money } from "../../domain/shared/money.js";
import { Payment } from "../../domain/booking/payment.js";
import { Point } from "../../domain/shared/point.js";
// oxlint-disable-next-line import/no-duplicates
import type { StoredEvent } from "../event-store/event-store.js";
import { TimeSlot } from "../../domain/shared/time-slot.js";

interface ReadBookingRow {
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

const STREAM_TYPE = "Booking";
const INITIAL_POINTS = 0;
const FIRST_EVENT_INDEX = 0;
const VERSION_OFFSET = 1;
const NO_EVENTS_VERSION = 0;

const serializeDomainEvent = (event: DomainEvent): string =>
  JSON.stringify(event, (_key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value as unknown;
  });

const toStoredEvent = (event: DomainEvent, streamId: string): StoredEvent => ({
  eventType: event.type,
  id: event.eventId,
  occurredAt: event.occurredAt.toISOString(),
  payload: serializeDomainEvent(event),
  streamId,
  streamType: STREAM_TYPE,
  version: event.version,
});

const mapRowToBooking = (row: ReadBookingRow): Booking => {
  const timeSlot = TimeSlot.create(new Date(row.start_time), new Date(row.end_time));
  const totalAmount = Money.create(row.total_amount);
  const defaultPaymentId = toPaymentId("");
  const defaultPoints = Point.create(INITIAL_POINTS);

  const payment = Payment.create({
    amount: totalAmount,
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    method: (row.payment_method ?? PaymentMethod.ON_SITE_CASH) as PaymentMethod,
    paidAt: null,
    paymentId: defaultPaymentId,
    pointsUsed: defaultPoints,
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    status: (row.payment_status ?? PaymentStatus.PENDING) as PaymentStatus,
  });

  return Booking.reconstitute({
    addedEquipment: [],
    bandId: toBandIdOrNull(row.band_id),
    bookingId: toBookingId(row.booking_id),
    createdAt: new Date(row.created_at),
    extensionRequest: null,
    memberId: toMemberId(row.member_id),
    payment,
    roomId: toRoomId(row.room_id),
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    status: row.status as BookingStatus,
    timeSlot,
    totalAmount,
  });
};

const buildUpsertParams = (booking: Booking): Record<string, unknown> => ({
  band_id: booking.bandId,
  booking_id: booking.bookingId,
  created_at: booking.createdAt.toISOString(),
  end_time: booking.timeSlot.endTime.toISOString(),
  member_id: booking.memberId,
  payment_method: booking.payment.method,
  payment_status: booking.payment.status,
  room_id: booking.roomId,
  start_time: booking.timeSlot.startTime.toISOString(),
  status: booking.status,
  total_amount: booking.totalAmount.amount,
  updated_at: new Date().toISOString(),
});

const calculateExpectedVersion = (events: DomainEvent[]): number =>
  events.length > FIRST_EVENT_INDEX
    ? events[FIRST_EVENT_INDEX].version - VERSION_OFFSET
    : NO_EVENTS_VERSION;

class D1BookingRepository implements BookingRepository {
  private readonly db: D1Database;
  private readonly eventStore: EventStore;

  constructor(db: D1Database) {
    this.db = db;
    this.eventStore = new EventStore(db);
  }

  async save(booking: Booking, events: DomainEvent[]): Promise<void> {
    const storedEvents = events.map((ev) => toStoredEvent(ev, booking.bookingId));
    const expectedVersion = calculateExpectedVersion(events);
    await this.appendEvents(booking.bookingId, storedEvents, expectedVersion);
    await this.upsertReadModel(booking);
  }

  async findById(id: BookingId): Promise<Booking | null> {
    const row = await this.db
      .prepare("SELECT * FROM read_bookings WHERE booking_id = ?")
      .bind(id)
      .first<ReadBookingRow>();

    return row ? mapRowToBooking(row) : null;
  }

  async findByMemberId(memberId: MemberId): Promise<Booking[]> {
    const result = await this.db
      .prepare("SELECT * FROM read_bookings WHERE member_id = ?")
      .bind(memberId)
      .all<ReadBookingRow>();

    return result.results.map((row) => mapRowToBooking(row));
  }

  async findOverlapping(roomId: RoomId, timeSlot: TimeSlot): Promise<Booking[]> {
    const result = await this.db
      .prepare(
        "SELECT * FROM read_bookings WHERE room_id = ? AND start_time < ? AND end_time > ? AND status NOT IN (?, ?)",
      )
      .bind(
        roomId,
        timeSlot.endTime.toISOString(),
        timeSlot.startTime.toISOString(),
        BookingStatus.CANCELLED,
        BookingStatus.COMPLETED,
      )
      .all<ReadBookingRow>();

    return result.results.map((row) => mapRowToBooking(row));
  }

  private async appendEvents(
    bookingId: string,
    storedEvents: StoredEvent[],
    expectedVersion: number,
  ): Promise<void> {
    await this.eventStore.append({
      events: storedEvents,
      expectedVersion,
      streamId: bookingId,
      streamType: STREAM_TYPE,
    });
  }

  private async upsertReadModel(booking: Booking): Promise<void> {
    const params = buildUpsertParams(booking);
    await this.db
      .prepare(
        `INSERT INTO read_bookings (booking_id, member_id, band_id, room_id, status, start_time, end_time, total_amount, payment_method, payment_status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
         ON CONFLICT(booking_id) DO UPDATE SET
           status = ?5, start_time = ?6, end_time = ?7, total_amount = ?8,
           payment_method = ?9, payment_status = ?10, updated_at = ?12`,
      )
      .bind(
        params.booking_id,
        params.member_id,
        params.band_id,
        params.room_id,
        params.status,
        params.start_time,
        params.end_time,
        params.total_amount,
        params.payment_method,
        params.payment_status,
        params.created_at,
        params.updated_at,
      )
      .run();
  }
}

export { D1BookingRepository };
