import type { BandId, BookingId, MemberId, PaymentId, RoomId } from "@my-app/shared";
import { toBookingId, toEventId, toPaymentId } from "../../infrastructure/brand-helpers.js";
import { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { CreateBookingProps } from "../../domain/booking/booking.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Money } from "../../domain/shared/money.js";
import { PaymentMethod } from "@my-app/shared";
import { Point } from "../../domain/shared/point.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";
import { TimeSlot } from "../../domain/shared/time-slot.js";

interface CreateBookingInput {
  memberId: MemberId;
  roomId: RoomId;
  bandId: BandId | null;
  startTime: Date;
  endTime: Date;
  paymentMethod: PaymentMethod;
  pointsToUse: number;
}

interface CreateBookingDeps {
  bookingRepo: BookingRepository;
  studioRepo: StudioRepository;
}

const ON_SITE_METHODS = new Set<PaymentMethod>([
  PaymentMethod.ON_SITE_CASH,
  PaymentMethod.ON_SITE_CARD,
]);

const FIRST_EVENT_VERSION = 1;
const NO_OVERLAPPING_BOOKINGS = 0;

const generateIds = (): { bookingId: BookingId; paymentId: PaymentId } => ({
  bookingId: toBookingId(crypto.randomUUID()),
  paymentId: toPaymentId(crypto.randomUUID()),
});

const assertRoomExists = async (studioRepo: StudioRepository, roomId: RoomId): Promise<Money> => {
  const room = await studioRepo.findRoomById(roomId);
  if (room === null) {
    throw new Error(`Room ${roomId} not found`);
  }
  return room.hourlyRate;
};

const assertNoOverlap = async (
  bookingRepo: BookingRepository,
  roomId: RoomId,
  timeSlot: TimeSlot,
): Promise<void> => {
  const overlapping = await bookingRepo.findOverlapping(roomId, timeSlot);
  if (overlapping.length > NO_OVERLAPPING_BOOKINGS) {
    throw new Error("Room is already booked for this time slot (BR-01)");
  }
};

const buildCreatedEvent = (booking: Booking, timeSlot: TimeSlot): DomainEvent => ({
  bookingId: booking.bookingId,
  endTime: timeSlot.endTime,
  eventId: toEventId(crypto.randomUUID()),
  memberId: booking.memberId,
  occurredAt: new Date(),
  roomId: booking.roomId,
  startTime: timeSlot.startTime,
  totalAmount: booking.totalAmount.amount,
  type: "BookingCreated",
  version: FIRST_EVENT_VERSION,
});

const transitionBooking = (booking: Booking, isOnSite: boolean): Booking =>
  isOnSite ? booking.confirmWithOnSitePayment() : booking.requestPayment();

interface BookingPropsContext {
  input: CreateBookingInput;
  ids: { bookingId: BookingId; paymentId: PaymentId };
  timeSlot: TimeSlot;
  totalAmount: Money;
}

const buildBookingProps = (ctx: BookingPropsContext): CreateBookingProps => ({
  bandId: ctx.input.bandId,
  bookingId: ctx.ids.bookingId,
  createdAt: new Date(),
  memberId: ctx.input.memberId,
  paymentId: ctx.ids.paymentId,
  paymentMethod: ctx.input.paymentMethod,
  pointsUsed: Point.create(ctx.input.pointsToUse),
  roomId: ctx.input.roomId,
  timeSlot: ctx.timeSlot,
  totalAmount: ctx.totalAmount,
});

const createBooking = async (
  input: CreateBookingInput,
  deps: CreateBookingDeps,
): Promise<Booking> => {
  const ids = generateIds();
  const timeSlot = TimeSlot.create(input.startTime, input.endTime);
  const hourlyRate = await assertRoomExists(deps.studioRepo, input.roomId);

  await assertNoOverlap(deps.bookingRepo, input.roomId, timeSlot);

  const totalAmount = hourlyRate.multiply(timeSlot.durationHours());
  const tentativeBooking = Booking.create(buildBookingProps({ ids, input, timeSlot, totalAmount }));
  const booking = transitionBooking(tentativeBooking, ON_SITE_METHODS.has(input.paymentMethod));
  const events: DomainEvent[] = [buildCreatedEvent(booking, timeSlot)];
  await deps.bookingRepo.save(booking, events);

  return booking;
};

export { createBooking };
export type { CreateBookingDeps, CreateBookingInput };
