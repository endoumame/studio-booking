import type { BookingId, RoomId } from "@my-app/shared";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Money } from "../../domain/shared/money.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";
import { toEventId } from "../../infrastructure/brand-helpers.js";

interface ApproveExtensionInput {
  bookingId: BookingId;
}

interface ApproveExtensionDeps {
  bookingRepo: BookingRepository;
  studioRepo: StudioRepository;
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

const loadHourlyRate = async (studioRepo: StudioRepository, roomId: RoomId): Promise<Money> => {
  const room = await studioRepo.findRoomById(roomId);
  if (room === null) {
    throw new Error(`Room ${roomId} not found`);
  }
  return room.hourlyRate;
};

const buildApprovedEvent = (approved: Booking): DomainEvent => {
  if (approved.extensionRequest === null) {
    throw new Error("Extension request is missing after approval");
  }
  return {
    bookingId: approved.bookingId,
    eventId: toEventId(crypto.randomUUID()),
    newEndTime: approved.timeSlot.endTime,
    newTotalAmount: approved.totalAmount.amount,
    occurredAt: new Date(),
    requestId: approved.extensionRequest.requestId,
    type: "ExtensionApproved",
    version: FIRST_EVENT_VERSION,
  };
};

const approveExtension = async (
  input: ApproveExtensionInput,
  deps: ApproveExtensionDeps,
): Promise<Booking> => {
  const existing = await loadBooking(deps.bookingRepo, input.bookingId);
  const hourlyRate = await loadHourlyRate(deps.studioRepo, existing.roomId);
  const approved = existing.approveExtension(hourlyRate);
  const events: DomainEvent[] = [buildApprovedEvent(approved)];
  await deps.bookingRepo.save(approved, events);

  return approved;
};

export { approveExtension };
export type { ApproveExtensionDeps, ApproveExtensionInput };
