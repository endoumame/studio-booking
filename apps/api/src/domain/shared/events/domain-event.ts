import type { BookingId, CardId, EventId, MemberId, PaymentId, RequestId } from "@my-app/shared";

interface DomainEventBase {
  readonly eventId: EventId;
  readonly occurredAt: Date;
  readonly version: number;
}

interface BookingCreated extends DomainEventBase {
  readonly type: "BookingCreated";
  readonly bookingId: BookingId;
  readonly memberId: MemberId;
  readonly roomId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly totalAmount: number;
}

interface BookingPaymentRequested extends DomainEventBase {
  readonly type: "BookingPaymentRequested";
  readonly bookingId: BookingId;
  readonly paymentId: PaymentId;
  readonly amount: number;
}

interface BookingConfirmed extends DomainEventBase {
  readonly type: "BookingConfirmed";
  readonly bookingId: BookingId;
}

interface BookingCheckedIn extends DomainEventBase {
  readonly type: "BookingCheckedIn";
  readonly bookingId: BookingId;
}

interface BookingInUse extends DomainEventBase {
  readonly type: "BookingInUse";
  readonly bookingId: BookingId;
}

interface BookingCompleted extends DomainEventBase {
  readonly type: "BookingCompleted";
  readonly bookingId: BookingId;
}

interface BookingCancelled extends DomainEventBase {
  readonly type: "BookingCancelled";
  readonly bookingId: BookingId;
  readonly refundAmount: number;
}

interface BookingEquipmentAdded extends DomainEventBase {
  readonly type: "BookingEquipmentAdded";
  readonly bookingId: BookingId;
  readonly equipmentId: string;
  readonly rentalFee: number;
}

interface BookingTimeSlotChanged extends DomainEventBase {
  readonly type: "BookingTimeSlotChanged";
  readonly bookingId: BookingId;
  readonly newStartTime: Date;
  readonly newEndTime: Date;
  readonly newTotalAmount: number;
}

interface ExtensionRequested extends DomainEventBase {
  readonly type: "ExtensionRequested";
  readonly bookingId: BookingId;
  readonly requestId: RequestId;
  readonly extraMinutes: number;
}

interface ExtensionApproved extends DomainEventBase {
  readonly type: "ExtensionApproved";
  readonly bookingId: BookingId;
  readonly requestId: RequestId;
  readonly newEndTime: Date;
  readonly newTotalAmount: number;
}

interface ExtensionRejected extends DomainEventBase {
  readonly type: "ExtensionRejected";
  readonly bookingId: BookingId;
  readonly requestId: RequestId;
}

interface PaymentCompleted extends DomainEventBase {
  readonly type: "PaymentCompleted";
  readonly paymentId: PaymentId;
  readonly bookingId: BookingId;
  readonly amount: number;
}

interface PaymentRefunded extends DomainEventBase {
  readonly type: "PaymentRefunded";
  readonly paymentId: PaymentId;
  readonly bookingId: BookingId;
  readonly refundAmount: number;
}

interface MemberCardIssued extends DomainEventBase {
  readonly type: "MemberCardIssued";
  readonly memberId: MemberId;
  readonly cardId: CardId;
  readonly cardNumber: string;
}

interface PointsEarned extends DomainEventBase {
  readonly type: "PointsEarned";
  readonly memberId: MemberId;
  readonly points: number;
  readonly bookingId: BookingId;
}

interface PointsUsed extends DomainEventBase {
  readonly type: "PointsUsed";
  readonly memberId: MemberId;
  readonly points: number;
  readonly bookingId: BookingId;
}

type DomainEvent =
  | BookingCancelled
  | BookingCheckedIn
  | BookingCompleted
  | BookingConfirmed
  | BookingCreated
  | BookingEquipmentAdded
  | BookingInUse
  | BookingPaymentRequested
  | BookingTimeSlotChanged
  | ExtensionApproved
  | ExtensionRejected
  | ExtensionRequested
  | MemberCardIssued
  | PaymentCompleted
  | PaymentRefunded
  | PointsEarned
  | PointsUsed;

type DomainEventType = DomainEvent["type"];

export type {
  BookingCancelled,
  BookingCheckedIn,
  BookingCompleted,
  BookingConfirmed,
  BookingCreated,
  BookingEquipmentAdded,
  BookingInUse,
  BookingPaymentRequested,
  BookingTimeSlotChanged,
  DomainEvent,
  DomainEventBase,
  DomainEventType,
  ExtensionApproved,
  ExtensionRejected,
  ExtensionRequested,
  MemberCardIssued,
  PaymentCompleted,
  PaymentRefunded,
  PointsEarned,
  PointsUsed,
};
