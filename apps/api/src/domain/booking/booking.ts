import type {
  BandId,
  BookingId,
  BookingStatusType,
  EquipmentId,
  MemberId,
  RoomId,
} from "@my-app/shared";
import { BookingStatus, PaymentMethod } from "@my-app/shared";
import type { CreateExtensionRequestProps, ExtensionRequest } from "./extension-request.js";
import { addMoney, multiplyMoney } from "../shared/money.js";
import { approveExtension, createExtensionRequest, rejectExtension } from "./extension-request.js";
import { completePayment, withPaymentAmount } from "./payment.js";
import { err, ok } from "neverthrow";
import { invalidState, validation } from "../shared/errors.js";
import type { DomainError } from "../shared/errors.js";
import type { Money } from "../shared/money.js";
import type { Payment } from "./payment.js";
import type { Result } from "neverthrow";
import type { TimeSlot } from "../shared/time-slot.js";
import { extendByMinutes } from "../shared/time-slot.js";

const MINUTES_PER_HOUR = 60;

interface Booking {
  readonly bookingId: BookingId;
  readonly status: BookingStatusType;
  readonly timeSlot: TimeSlot;
  readonly totalAmount: Money;
  readonly createdAt: Date;
  readonly memberId: MemberId;
  readonly bandId: BandId | null;
  readonly roomId: RoomId;
  readonly addedEquipment: readonly EquipmentId[];
  readonly payment: Payment;
  readonly extensionRequest: ExtensionRequest | null;
}

interface CreateBookingProps {
  readonly bookingId: BookingId;
  readonly timeSlot: TimeSlot;
  readonly totalAmount: Money;
  readonly createdAt: Date;
  readonly memberId: MemberId;
  readonly bandId: BandId | null;
  readonly roomId: RoomId;
  readonly payment: Payment;
}

const EMPTY_EQUIPMENT: readonly EquipmentId[] = [];

const createBooking = (props: CreateBookingProps): Result<Booking, DomainError> =>
  ok({
    addedEquipment: EMPTY_EQUIPMENT,
    bandId: props.bandId,
    bookingId: props.bookingId,
    createdAt: props.createdAt,
    extensionRequest: null,
    memberId: props.memberId,
    payment: props.payment,
    roomId: props.roomId,
    status: BookingStatus.TENTATIVE,
    timeSlot: props.timeSlot,
    totalAmount: props.totalAmount,
  });

const requireStatus = (
  booking: Booking,
  expected: BookingStatusType,
): Result<Booking, DomainError> => {
  if (booking.status !== expected) {
    return err(invalidState(`Booking must be ${expected} but is ${booking.status}`));
  }
  return ok(booking);
};

const isOnlinePayment = (booking: Booking): boolean =>
  booking.payment.method === PaymentMethod.ONLINE_CREDIT_CARD;

const requestBookingPayment = (booking: Booking): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.TENTATIVE).andThen((bk) => {
    if (!isOnlinePayment(bk)) {
      return err(invalidState("Only online payments can be requested"));
    }
    return ok({ ...bk, status: BookingStatus.AWAITING_PAYMENT });
  });

const confirmOnlinePayment = (booking: Booking, paidAt: Date): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.AWAITING_PAYMENT).andThen((bk) =>
    completePayment(bk.payment, paidAt).map((payment) => ({
      ...bk,
      payment,
      status: BookingStatus.CONFIRMED,
    })),
  );

const confirmOnSitePayment = (booking: Booking): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.TENTATIVE).andThen((bk) => {
    if (isOnlinePayment(bk)) {
      return err(invalidState("On-site confirmation not allowed for online payments"));
    }
    return ok({ ...bk, status: BookingStatus.CONFIRMED });
  });

const CANCEL_FORBIDDEN = new Set<BookingStatusType>([
  BookingStatus.COMPLETED,
  BookingStatus.IN_USE,
]);

const cancelBooking = (booking: Booking): Result<Booking, DomainError> => {
  if (CANCEL_FORBIDDEN.has(booking.status)) {
    return err(invalidState("Cannot cancel a completed or in-use booking"));
  }
  return ok({ ...booking, status: BookingStatus.CANCELLED });
};

const checkInBooking = (booking: Booking): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.CONFIRMED).map((bk) => ({
    ...bk,
    status: BookingStatus.CHECKED_IN,
  }));

const startBookingUse = (booking: Booking): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.CHECKED_IN).map((bk) => ({
    ...bk,
    status: BookingStatus.IN_USE,
  }));

const completeBooking = (booking: Booking, paidAt: Date): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.IN_USE).andThen((bk) =>
    completePayment(bk.payment, paidAt).map((payment) => ({
      ...bk,
      payment,
      status: BookingStatus.COMPLETED,
    })),
  );

interface AddEquipmentProps {
  readonly equipmentId: EquipmentId;
  readonly rentalFee: Money;
}

const addBookingEquipment = (
  booking: Booking,
  props: AddEquipmentProps,
): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.CONFIRMED).map((bk) => ({
    ...bk,
    addedEquipment: [...bk.addedEquipment, props.equipmentId],
    totalAmount: addMoney(bk.totalAmount, props.rentalFee),
  }));

interface ChangeTimeSlotProps {
  readonly newSlot: TimeSlot;
  readonly newTotal: Money;
}

const changeBookingTimeSlot = (
  booking: Booking,
  props: ChangeTimeSlotProps,
): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.CONFIRMED).map((bk) => ({
    ...bk,
    timeSlot: props.newSlot,
    totalAmount: props.newTotal,
  }));

const requestBookingExtension = (
  booking: Booking,
  props: CreateExtensionRequestProps,
): Result<Booking, DomainError> =>
  requireStatus(booking, BookingStatus.IN_USE).andThen((bk) => {
    if (bk.extensionRequest !== null) {
      return err(validation("Booking already has an extension request"));
    }
    return createExtensionRequest(props).map((ext) => ({
      ...bk,
      extensionRequest: ext,
    }));
  });

const requirePendingExtension = (booking: Booking): Result<ExtensionRequest, DomainError> => {
  if (booking.extensionRequest === null) {
    return err(invalidState("Booking has no extension request"));
  }
  return ok(booking.extensionRequest);
};

const computeExtensionCost = (extraMinutes: number, hourlyRate: Money): Money =>
  multiplyMoney(hourlyRate, extraMinutes / MINUTES_PER_HOUR);

const approveBookingExtension = (
  booking: Booking,
  hourlyRate: Money,
): Result<Booking, DomainError> =>
  requirePendingExtension(booking).andThen((ext) =>
    approveExtension(ext).map((approved) => {
      const extraCost = computeExtensionCost(approved.extraMinutes, hourlyRate);
      return {
        ...booking,
        extensionRequest: approved,
        payment: withPaymentAmount(booking.payment, addMoney(booking.totalAmount, extraCost)),
        timeSlot: extendByMinutes(booking.timeSlot, approved.extraMinutes),
        totalAmount: addMoney(booking.totalAmount, extraCost),
      };
    }),
  );

const rejectBookingExtension = (booking: Booking): Result<Booking, DomainError> =>
  requirePendingExtension(booking).andThen((ext) =>
    rejectExtension(ext).map((rejected) => ({
      ...booking,
      extensionRequest: rejected,
    })),
  );

export {
  addBookingEquipment,
  approveBookingExtension,
  cancelBooking,
  changeBookingTimeSlot,
  checkInBooking,
  completeBooking,
  confirmOnSitePayment,
  confirmOnlinePayment,
  createBooking,
  rejectBookingExtension,
  requestBookingExtension,
  requestBookingPayment,
  startBookingUse,
};
export type { AddEquipmentProps, Booking, ChangeTimeSlotProps, CreateBookingProps };
