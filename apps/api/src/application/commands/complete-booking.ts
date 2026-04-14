import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import { toEventId } from "../../infrastructure/brand-helpers.js";

interface CompleteBookingInput {
  bookingId: BookingId;
}

interface CompleteBookingDeps {
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

const buildCompletedEvent = (bookingId: BookingId): DomainEvent => ({
  bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  type: "BookingCompleted",
  version: FIRST_EVENT_VERSION,
});

const completeBooking = async (
  input: CompleteBookingInput,
  deps: CompleteBookingDeps,
): Promise<Booking> => {
  const existing = await loadBooking(deps.bookingRepo, input.bookingId);
  const completed = existing.complete(new Date());
  const events: DomainEvent[] = [buildCompletedEvent(input.bookingId)];
  await deps.bookingRepo.save(completed, events);

  return completed;
};

export { completeBooking };
export type { CompleteBookingDeps, CompleteBookingInput };
