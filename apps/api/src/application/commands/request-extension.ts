import type { BookingId, RequestId } from "@my-app/shared";
import { err, ok } from "neverthrow";
import { toEventId, toRequestId } from "../../infrastructure/brand-helpers.js";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Result } from "neverthrow";
import { notFound } from "../../domain/shared/errors.js";
import { requestBookingExtension } from "../../domain/booking/booking.js";

const INITIAL_VERSION = 1;

interface RequestExtensionInput {
  readonly bookingId: BookingId;
  readonly extraMinutes: number;
}

interface RequestExtensionDeps {
  readonly bookingRepo: BookingRepository;
}

const generateRequestId = (): RequestId => toRequestId(crypto.randomUUID());

const buildExtensionEvent = (
  booking: Booking,
  requestId: RequestId,
  extraMinutes: number,
): DomainEvent => ({
  bookingId: booking.bookingId,
  eventId: toEventId(crypto.randomUUID()),
  extraMinutes,
  occurredAt: new Date(),
  requestId,
  type: "ExtensionRequested",
  version: INITIAL_VERSION,
});

const saveExtension = async (
  deps: RequestExtensionDeps,
  updated: Booking,
  context: { requestId: RequestId; extraMinutes: number },
): Promise<Result<Booking, DomainError>> => {
  const events: readonly DomainEvent[] = [
    buildExtensionEvent(updated, context.requestId, context.extraMinutes),
  ];
  const saveResult = await deps.bookingRepo.save(updated, events);
  return saveResult.map(() => updated);
};

const requestExtensionCommand = async (
  input: RequestExtensionInput,
  deps: RequestExtensionDeps,
): Promise<Result<Booking, DomainError>> => {
  const requestId = generateRequestId();

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

  const extended = requestBookingExtension(bookingResult.value, {
    extraMinutes: input.extraMinutes,
    requestId,
    requestedAt: new Date(),
  });
  if (extended.isErr()) {
    return err(extended.error);
  }

  return saveExtension(deps, extended.value, {
    extraMinutes: input.extraMinutes,
    requestId,
  });
};

export { requestExtensionCommand };
export type { RequestExtensionDeps, RequestExtensionInput };
