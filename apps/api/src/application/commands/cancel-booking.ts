import { err, ok } from "neverthrow";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Result } from "neverthrow";
import { cancelBooking } from "../../domain/booking/booking.js";
import { notFound } from "../../domain/shared/errors.js";
import { toEventId } from "../../infrastructure/brand-helpers.js";

const INITIAL_VERSION = 1;
const NO_REFUND = 0;

interface CancelBookingInput {
  readonly bookingId: BookingId;
}

interface CancelBookingDeps {
  readonly bookingRepo: BookingRepository;
}

const buildCancelledEvent = (booking: Booking): DomainEvent => ({
  bookingId: booking.bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  refundAmount: NO_REFUND,
  type: "BookingCancelled",
  version: INITIAL_VERSION,
});

const saveWithEvents = async (
  deps: CancelBookingDeps,
  cancelled: Booking,
): Promise<Result<Booking, DomainError>> => {
  const events: readonly DomainEvent[] = [buildCancelledEvent(cancelled)];
  const saveResult = await deps.bookingRepo.save(cancelled, events);
  return saveResult.map(() => cancelled);
};

const cancelBookingCommand = async (
  input: CancelBookingInput,
  deps: CancelBookingDeps,
): Promise<Result<Booking, DomainError>> => {
  const result = await deps.bookingRepo.findById(input.bookingId);
  const bookingResult = result.andThen((booking) => {
    if (booking === null) {
      return err(notFound("Booking not found"));
    }
    return ok(booking);
  });
  if (bookingResult.isErr()) {
    return err(bookingResult.error);
  }

  const cancelled = cancelBooking(bookingResult.value);
  if (cancelled.isErr()) {
    return err(cancelled.error);
  }

  return saveWithEvents(deps, cancelled.value);
};

export { cancelBookingCommand };
export type { CancelBookingDeps, CancelBookingInput };
