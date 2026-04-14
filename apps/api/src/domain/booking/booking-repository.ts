import type { BookingId, MemberId, RoomId } from "@my-app/shared";

import type { Booking } from "./booking.js";
import type { DomainEvent } from "../shared/events/domain-event.js";
import type { TimeSlot } from "../shared/time-slot.js";

interface BookingRepository {
  save(booking: Booking, events: DomainEvent[]): Promise<void>;
  findById(id: BookingId): Promise<Booking | null>;
  findByMemberId(memberId: MemberId): Promise<Booking[]>;
  findOverlapping(roomId: RoomId, timeSlot: TimeSlot): Promise<Booking[]>;
}

export type { BookingRepository };
