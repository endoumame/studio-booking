import type { BookingId, RoomId } from "@my-app/shared";
import { err, ok } from "neverthrow";
import { toEventId, toRequestId } from "../../infrastructure/brand-helpers.js";
// oxlint-disable-next-line import/no-duplicates
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Result } from "neverthrow";
import type { Room } from "../../domain/studio/room.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";
import { approveBookingExtension } from "../../domain/booking/booking.js";
import { notFound } from "../../domain/shared/errors.js";

const INITIAL_VERSION = 1;

interface ApproveExtensionInput {
  readonly bookingId: BookingId;
  readonly roomId: RoomId;
}

interface ApproveExtensionDeps {
  readonly bookingRepo: BookingRepository;
  readonly studioRepo: StudioRepository;
}

const loadBookingForApproval = async (
  input: ApproveExtensionInput,
  deps: ApproveExtensionDeps,
): Promise<Result<Booking, DomainError>> => {
  const result = await deps.bookingRepo.findById(input.bookingId);
  return result.andThen((booking) => {
    if (booking === null) {
      return err(notFound("Booking not found"));
    }
    return ok(booking);
  });
};

const loadRoomForApproval = async (
  input: ApproveExtensionInput,
  deps: ApproveExtensionDeps,
): Promise<Result<Room, DomainError>> => {
  const result = await deps.studioRepo.findRoomById(input.roomId);
  return result.andThen((room) => {
    if (room === null) {
      return err(notFound("Room not found"));
    }
    return ok(room);
  });
};

const buildApprovedEvent = (booking: Booking): DomainEvent => ({
  bookingId: booking.bookingId,
  eventId: toEventId(crypto.randomUUID()),
  newEndTime: booking.timeSlot.endTime,
  newTotalAmount: booking.totalAmount.amount,
  occurredAt: new Date(),
  requestId: booking.extensionRequest?.requestId ?? toRequestId(crypto.randomUUID()),
  type: "ExtensionApproved",
  version: INITIAL_VERSION,
});

const saveApproved = async (
  deps: ApproveExtensionDeps,
  approved: Booking,
): Promise<Result<Booking, DomainError>> => {
  const events: readonly DomainEvent[] = [buildApprovedEvent(approved)];
  const saveResult = await deps.bookingRepo.save(approved, events);
  return saveResult.map(() => approved);
};

const approveExtensionCommand = async (
  input: ApproveExtensionInput,
  deps: ApproveExtensionDeps,
): Promise<Result<Booking, DomainError>> => {
  const bookingResult = await loadBookingForApproval(input, deps);
  if (bookingResult.isErr()) {
    return err(bookingResult.error);
  }

  const roomResult = await loadRoomForApproval(input, deps);
  if (roomResult.isErr()) {
    return err(roomResult.error);
  }

  const approved = approveBookingExtension(bookingResult.value, roomResult.value.hourlyRate);
  if (approved.isErr()) {
    return err(approved.error);
  }

  return saveApproved(deps, approved.value);
};

export { approveExtensionCommand };
export type { ApproveExtensionDeps, ApproveExtensionInput };
