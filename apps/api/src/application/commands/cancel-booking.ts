import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import { toEventId } from "../../infrastructure/brand-helpers.js";

interface CancelBookingInput {
  bookingId: BookingId;
}

interface CancelBookingDeps {
  bookingRepo: BookingRepository;
}

const FIRST_EVENT_VERSION = 1;

const loadBooking = async (
  bookingRepo: BookingRepository,
  bookingId: BookingId,
): Promise<Booking> => {
  const booking = await bookingRepo.findById(bookingId);
  if (booking === null) {
    throw new Error(`Booking ${bookingId} not found`);
  }
  return booking;
};

const buildCancelledEvent = (bookingId: BookingId, refundAmount: number): DomainEvent => ({
  bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  refundAmount,
  type: "BookingCancelled",
  version: FIRST_EVENT_VERSION,
});

const cancelBooking = async (
  input: CancelBookingInput,
  deps: CancelBookingDeps,
): Promise<Booking> => {
  const existing = await loadBooking(deps.bookingRepo, input.bookingId);
  const cancelled = existing.cancel();
  const events: DomainEvent[] = [
    buildCancelledEvent(input.bookingId, cancelled.payment.amount.amount),
  ];
  await deps.bookingRepo.save(cancelled, events);

  return cancelled;
};

export { cancelBooking };
export type { CancelBookingDeps, CancelBookingInput };
