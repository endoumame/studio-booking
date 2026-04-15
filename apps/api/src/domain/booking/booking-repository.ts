import type { BookingId, MemberId, RoomId } from "@my-app/shared";
import type { Booking } from "./booking.js";
import type { DomainError } from "../shared/errors.js";
import type { DomainEvent } from "../shared/events/domain-event.js";
import type { Result } from "neverthrow";
import type { TimeSlot } from "../shared/time-slot.js";

interface BookingRepository {
  readonly save: (
    booking: Booking,
    events: readonly DomainEvent[],
  ) => Promise<Result<null, DomainError>>;
  readonly findById: (id: BookingId) => Promise<Result<Booking | null, DomainError>>;
  readonly findByMemberId: (memberId: MemberId) => Promise<Result<readonly Booking[], DomainError>>;
  readonly findOverlapping: (
    roomId: RoomId,
    timeSlot: TimeSlot,
  ) => Promise<Result<readonly Booking[], DomainError>>;
}

export type { BookingRepository };
