/* oxlint-disable sort-imports */
import type {
  BandId,
  BookingId,
  MemberId,
  PaymentId,
  PaymentMethodType,
  RoomId,
} from "@my-app/shared";
import type { Booking, CreateBookingProps } from "../../domain/booking/index.js";
import type { DomainError, DomainEvent, Money, TimeSlot } from "../../domain/shared/index.js";
import { PaymentMethod } from "@my-app/shared";
import {
  confirmOnSitePayment,
  createBooking,
  createPayment,
  requestBookingPayment,
} from "../../domain/booking/index.js";
import { conflict, createTimeSlot, durationHours, notFound } from "../../domain/shared/index.js";
import { err, ok } from "neverthrow";
import { toBookingId, toEventId, toPaymentId } from "../../infrastructure/brand-helpers.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { Result } from "neverthrow";
import type { Room } from "../../domain/studio/room.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";
import { calculateRoomCost } from "../../domain/studio/room.js";
/* oxlint-enable sort-imports */

const ZERO_OVERLAPS = 0;
const INITIAL_VERSION = 1;

interface CreateBookingInput {
  readonly memberId: MemberId;
  readonly roomId: RoomId;
  readonly bandId: BandId | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly paymentMethod: PaymentMethodType;
  readonly pointsToUse: number;
}

interface CreateBookingDeps {
  readonly bookingRepo: BookingRepository;
  readonly studioRepo: StudioRepository;
}

const buildTimeSlot = (input: CreateBookingInput): Result<TimeSlot, DomainError> =>
  createTimeSlot(input.startTime, input.endTime);

const ensureRoomExists = async (
  deps: CreateBookingDeps,
  input: CreateBookingInput,
): Promise<Result<Room, DomainError>> => {
  const result = await deps.studioRepo.findRoomById(input.roomId);
  return result.andThen((room) => {
    if (room === null) {
      return err(notFound("Room not found"));
    }
    return ok(room);
  });
};

const ensureNoOverlap = async (
  deps: CreateBookingDeps,
  input: CreateBookingInput,
): Promise<Result<true, DomainError>> => {
  const result = await deps.bookingRepo.findOverlapping(input.roomId, {
    endTime: input.endTime,
    startTime: input.startTime,
  });
  return result.andThen((overlapping) => {
    if (overlapping.length > ZERO_OVERLAPS) {
      return err(conflict("Room is already booked for this time slot (BR-01)"));
    }
    return ok(true as const);
  });
};

const generateIds = (): { bookingId: BookingId; paymentId: PaymentId } => ({
  bookingId: toBookingId(crypto.randomUUID()),
  paymentId: toPaymentId(crypto.randomUUID()),
});

const computeCost = (room: Room, slot: TimeSlot): Money =>
  calculateRoomCost(room, durationHours(slot));

const buildBookingProps = (
  input: CreateBookingInput,
  ids: { bookingId: BookingId; paymentId: PaymentId },
  context: { cost: Money; slot: TimeSlot },
): CreateBookingProps => ({
  bandId: input.bandId,
  bookingId: ids.bookingId,
  createdAt: new Date(),
  memberId: input.memberId,
  payment: createPayment({
    amount: context.cost,
    method: input.paymentMethod,
    paymentId: ids.paymentId,
    pointsUsed: { value: input.pointsToUse },
  }),
  roomId: input.roomId,
  timeSlot: context.slot,
  totalAmount: context.cost,
});

const applyPaymentFlow = (
  booking: Booking,
  method: PaymentMethodType,
): Result<Booking, DomainError> => {
  if (method === PaymentMethod.ONLINE_CREDIT_CARD) {
    return requestBookingPayment(booking);
  }
  return confirmOnSitePayment(booking);
};

const buildCreatedEvent = (booking: Booking): DomainEvent => ({
  bookingId: booking.bookingId,
  endTime: booking.timeSlot.endTime,
  eventId: toEventId(crypto.randomUUID()),
  memberId: booking.memberId,
  occurredAt: new Date(),
  roomId: booking.roomId,
  startTime: booking.timeSlot.startTime,
  totalAmount: booking.totalAmount.amount,
  type: "BookingCreated",
  version: INITIAL_VERSION,
});

const validateAndLoadDeps = async (
  input: CreateBookingInput,
  deps: CreateBookingDeps,
): Promise<Result<{ room: Room; slot: TimeSlot }, DomainError>> => {
  const slotResult = buildTimeSlot(input);
  if (slotResult.isErr()) {
    return err(slotResult.error);
  }

  const roomResult = await ensureRoomExists(deps, input);
  if (roomResult.isErr()) {
    return err(roomResult.error);
  }

  const overlapResult = await ensureNoOverlap(deps, input);
  if (overlapResult.isErr()) {
    return err(overlapResult.error);
  }

  return ok({ room: roomResult.value, slot: slotResult.value });
};

const saveBooking = async (
  deps: CreateBookingDeps,
  booking: Booking,
): Promise<Result<Booking, DomainError>> => {
  const events: readonly DomainEvent[] = [buildCreatedEvent(booking)];
  const saveResult = await deps.bookingRepo.save(booking, events);
  return saveResult.map(() => booking);
};

const buildAndApplyPayment = (
  input: CreateBookingInput,
  loaded: { room: Room; slot: TimeSlot },
): Result<Booking, DomainError> => {
  const ids = generateIds();
  const cost = computeCost(loaded.room, loaded.slot);
  const props = buildBookingProps(input, ids, { cost, slot: loaded.slot });
  return createBooking(props).andThen((bk) => applyPaymentFlow(bk, input.paymentMethod));
};

const createBookingCommand = async (
  input: CreateBookingInput,
  deps: CreateBookingDeps,
): Promise<Result<Booking, DomainError>> => {
  const loaded = await validateAndLoadDeps(input, deps);
  if (loaded.isErr()) {
    return err(loaded.error);
  }

  const booking = buildAndApplyPayment(input, loaded.value);
  if (booking.isErr()) {
    return err(booking.error);
  }

  return saveBooking(deps, booking.value);
};

export { createBookingCommand };
export type { CreateBookingDeps, CreateBookingInput };
