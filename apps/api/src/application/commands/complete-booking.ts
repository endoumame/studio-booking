import { err, ok } from "neverthrow";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Result } from "neverthrow";
import { completeBooking } from "../../domain/booking/booking.js";
import { notFound } from "../../domain/shared/errors.js";
import { toEventId } from "../../infrastructure/brand-helpers.js";

const INITIAL_VERSION = 1;

interface CompleteBookingInput {
  readonly bookingId: BookingId;
}

interface CompleteBookingDeps {
  readonly bookingRepo: BookingRepository;
}

const buildCompletedEvent = (booking: Booking): DomainEvent => ({
  bookingId: booking.bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  type: "BookingCompleted",
  version: INITIAL_VERSION,
});

const saveCompleted = async (
  deps: CompleteBookingDeps,
  completed: Booking,
): Promise<Result<Booking, DomainError>> => {
  const events: readonly DomainEvent[] = [buildCompletedEvent(completed)];
  const saveResult = await deps.bookingRepo.save(completed, events);
  return saveResult.map(() => completed);
};

const completeBookingCommand = async (
  input: CompleteBookingInput,
  deps: CompleteBookingDeps,
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

  const completed = completeBooking(bookingResult.value, new Date());
  if (completed.isErr()) {
    return err(completed.error);
  }

  return saveCompleted(deps, completed.value);
};

export { completeBookingCommand };
export type { CompleteBookingDeps, CompleteBookingInput };
