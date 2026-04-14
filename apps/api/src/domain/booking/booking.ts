import type {
  BandId,
  BookingId,
  EquipmentId,
  MemberId,
  PaymentId,
  RequestId,
  RoomId,
} from "@my-app/shared";
import { BookingStatus, PaymentMethod, PaymentStatus } from "@my-app/shared";
import { ExtensionRequest } from "./extension-request.js";
import type { Money } from "../shared/money.js";
import { Payment } from "./payment.js";
import type { Point } from "../shared/point.js";
import type { TimeSlot } from "../shared/time-slot.js";

interface CreateBookingProps {
  bookingId: BookingId;
  memberId: MemberId;
  bandId: BandId | null;
  roomId: RoomId;
  timeSlot: TimeSlot;
  totalAmount: Money;
  paymentId: PaymentId;
  paymentMethod: PaymentMethod;
  pointsUsed: Point;
  createdAt: Date;
}

interface BookingState {
  bookingId: BookingId;
  status: BookingStatus;
  timeSlot: TimeSlot;
  totalAmount: Money;
  createdAt: Date;
  memberId: MemberId;
  bandId: BandId | null;
  roomId: RoomId;
  addedEquipment: EquipmentId[];
  payment: Payment;
  extensionRequest: ExtensionRequest | null;
}

const TERMINAL_STATUSES = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
]);

const NON_CANCELLABLE_STATUSES = new Set<BookingStatus>([
  BookingStatus.COMPLETED,
  BookingStatus.IN_USE,
  BookingStatus.CANCELLED,
]);

class Booking {
  readonly bookingId!: BookingId;
  readonly status!: BookingStatus;
  readonly timeSlot!: TimeSlot;
  readonly totalAmount!: Money;
  readonly createdAt!: Date;
  readonly memberId!: MemberId;
  readonly bandId!: BandId | null;
  readonly roomId!: RoomId;
  readonly addedEquipment!: readonly EquipmentId[];
  readonly payment!: Payment;
  readonly extensionRequest!: ExtensionRequest | null;

  private constructor(state: BookingState) {
    Object.assign(this, state);
    this.addedEquipment = [...state.addedEquipment];
  }

  static create(props: CreateBookingProps): Booking {
    const paymentAmount = props.totalAmount.subtract(props.pointsUsed.toMoney());
    const isOnSite =
      props.paymentMethod === PaymentMethod.ON_SITE_CASH ||
      props.paymentMethod === PaymentMethod.ON_SITE_CARD;

    const payment = Payment.create({
      amount: paymentAmount,
      method: props.paymentMethod,
      paidAt: null,
      paymentId: props.paymentId,
      pointsUsed: props.pointsUsed,
      status: isOnSite ? PaymentStatus.PENDING : PaymentStatus.PENDING,
    });

    return new Booking({
      addedEquipment: [],
      bandId: props.bandId,
      bookingId: props.bookingId,
      createdAt: props.createdAt,
      extensionRequest: null,
      memberId: props.memberId,
      payment,
      roomId: props.roomId,
      status: BookingStatus.TENTATIVE,
      timeSlot: props.timeSlot,
      totalAmount: props.totalAmount,
    });
  }

  static reconstitute(state: BookingState): Booking {
    return new Booking(state);
  }

  requestPayment(): Booking {
    this.assertStatus(BookingStatus.TENTATIVE, "request payment");
    if (!this.payment.isOnline()) {
      throw new Error("Payment request is only for online payments");
    }
    return this.withStatus(BookingStatus.AWAITING_PAYMENT);
  }

  confirmWithOnlinePayment(paidAt: Date): Booking {
    this.assertStatus(BookingStatus.AWAITING_PAYMENT, "confirm with online payment");
    return this.withState({
      payment: this.payment.complete(paidAt),
      status: BookingStatus.CONFIRMED,
    });
  }

  confirmWithOnSitePayment(): Booking {
    this.assertStatus(BookingStatus.TENTATIVE, "confirm with on-site payment");
    if (!this.payment.isOnSite()) {
      throw new Error("On-site confirmation requires on-site payment method");
    }
    return this.withStatus(BookingStatus.CONFIRMED);
  }

  cancel(): Booking {
    if (NON_CANCELLABLE_STATUSES.has(this.status)) {
      throw new Error(`Cannot cancel booking in ${this.status} status`);
    }
    return this.withStatus(BookingStatus.CANCELLED);
  }

  checkIn(): Booking {
    this.assertStatus(BookingStatus.CONFIRMED, "check in");
    return this.withStatus(BookingStatus.CHECKED_IN);
  }

  startUse(): Booking {
    this.assertStatus(BookingStatus.CHECKED_IN, "start use");
    return this.withStatus(BookingStatus.IN_USE);
  }

  complete(paidAt: Date): Booking {
    this.assertStatus(BookingStatus.IN_USE, "complete");
    const completedPayment =
      this.payment.status === PaymentStatus.PENDING ? this.payment.complete(paidAt) : this.payment;
    return this.withState({
      payment: completedPayment,
      status: BookingStatus.COMPLETED,
    });
  }

  addEquipment(equipmentId: EquipmentId, rentalFee: Money): Booking {
    this.assertModifiable();
    const equipment = [...this.addedEquipment, equipmentId];
    const newTotal = this.totalAmount.add(rentalFee);
    const newPaymentAmount = newTotal.subtract(this.payment.pointsUsed.toMoney());
    return this.withState({
      addedEquipment: equipment,
      payment: this.payment.withAmount(newPaymentAmount),
      totalAmount: newTotal,
    });
  }

  changeTimeSlot(newTimeSlot: TimeSlot, newTotalAmount: Money): Booking {
    this.assertModifiable();
    const newPaymentAmount = newTotalAmount.subtract(this.payment.pointsUsed.toMoney());
    return this.withState({
      payment: this.payment.withAmount(newPaymentAmount),
      timeSlot: newTimeSlot,
      totalAmount: newTotalAmount,
    });
  }

  requestExtension(requestId: RequestId, extraMinutes: number, requestedAt: Date): Booking {
    this.assertStatus(BookingStatus.IN_USE, "request extension");
    if (this.extensionRequest !== null) {
      throw new Error("Extension already requested for this booking (BR-40)");
    }
    const extension = ExtensionRequest.create(requestId, extraMinutes, requestedAt);
    return this.withState({ extensionRequest: extension });
  }

  approveExtension(hourlyRate: Money): Booking {
    if (this.extensionRequest === null || !this.extensionRequest.isPending()) {
      throw new Error("No pending extension request to approve");
    }
    const approved = this.extensionRequest.approve();
    const newTimeSlot = this.timeSlot.extendByMinutes(approved.extraMinutes);
    const minutesPerHour = 60;
    const extensionCost = hourlyRate.multiply(approved.extraMinutes / minutesPerHour);
    const newTotal = this.totalAmount.add(extensionCost);
    const newPaymentAmount = newTotal.subtract(this.payment.pointsUsed.toMoney());
    return this.withState({
      extensionRequest: approved,
      payment: this.payment.withAmount(newPaymentAmount),
      timeSlot: newTimeSlot,
      totalAmount: newTotal,
    });
  }

  rejectExtension(): Booking {
    if (this.extensionRequest === null || !this.extensionRequest.isPending()) {
      throw new Error("No pending extension request to reject");
    }
    return this.withState({
      extensionRequest: this.extensionRequest.reject(),
    });
  }

  isTerminal(): boolean {
    return TERMINAL_STATUSES.has(this.status);
  }

  private assertStatus(expected: BookingStatus, action: string): void {
    if (this.status !== expected) {
      throw new Error(`Cannot ${action}: booking is in ${this.status}, expected ${expected}`);
    }
  }

  private assertModifiable(): void {
    if (this.status !== BookingStatus.CONFIRMED) {
      throw new Error("Booking can only be modified in CONFIRMED status (BR-04)");
    }
  }

  private toState(): BookingState {
    return {
      addedEquipment: [...this.addedEquipment],
      bandId: this.bandId,
      bookingId: this.bookingId,
      createdAt: this.createdAt,
      extensionRequest: this.extensionRequest,
      memberId: this.memberId,
      payment: this.payment,
      roomId: this.roomId,
      status: this.status,
      timeSlot: this.timeSlot,
      totalAmount: this.totalAmount,
    };
  }

  private withStatus(status: BookingStatus): Booking {
    return new Booking({ ...this.toState(), status });
  }

  private withState(partial: Partial<BookingState>): Booking {
    return new Booking({ ...this.toState(), ...partial });
  }
}

export { Booking };
export type { BookingState, CreateBookingProps };
