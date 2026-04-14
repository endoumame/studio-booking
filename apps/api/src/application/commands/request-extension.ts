import { toEventId, toRequestId } from "../../infrastructure/brand-helpers.js";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";

interface RequestExtensionInput {
  bookingId: BookingId;
  extraMinutes: number;
}

interface RequestExtensionDeps {
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

const buildExtensionRequestedEvent = (booking: Booking, extraMinutes: number): DomainEvent => ({
  bookingId: booking.bookingId,
  eventId: toEventId(crypto.randomUUID()),
  extraMinutes,
  occurredAt: new Date(),
  requestId: toRequestId(crypto.randomUUID()),
  type: "ExtensionRequested",
  version: FIRST_EVENT_VERSION,
});

const requestExtension = async (
  input: RequestExtensionInput,
  deps: RequestExtensionDeps,
): Promise<Booking> => {
  const existing = await loadBooking(deps.bookingRepo, input.bookingId);
  const requestId = toRequestId(crypto.randomUUID());
  const extended = existing.requestExtension(requestId, input.extraMinutes, new Date());
  const events: DomainEvent[] = [buildExtensionRequestedEvent(extended, input.extraMinutes)];
  await deps.bookingRepo.save(extended, events);

  return extended;
};

export { requestExtension };
export type { RequestExtensionDeps, RequestExtensionInput };
