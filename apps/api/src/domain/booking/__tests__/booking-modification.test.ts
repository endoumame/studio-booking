import type {
  BandId,
  BookingId,
  EquipmentId,
  MemberId,
  PaymentId,
  RequestId,
  RoomId,
} from "@my-app/shared";
import { BookingStatus, PaymentMethod } from "@my-app/shared";
import { Booking } from "../booking.js";
import { Money } from "../../shared/money.js";
import { Point } from "../../shared/point.js";
import { TimeSlot } from "../../shared/time-slot.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const BOOKING_ID = "BK-001" as BookingId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const MEMBER_ID = "MEM-001" as MemberId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const BAND_ID = "BAND-001" as BandId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ROOM_ID = "ROOM-001" as RoomId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const PAYMENT_ID = "PAY-001" as PaymentId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const REQUEST_ID = "REQ-001" as RequestId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const EQUIPMENT_ID = "EQ-001" as EquipmentId;
const AMOUNT_5000 = 5000;
const AMOUNT_1000 = 1000;
const AMOUNT_6000 = 6000;
const AMOUNT_7500 = 7500;
const POINTS_ZERO = 0;
const EXTRA_MINUTES_30 = 30;
const HOURLY_RATE = 5000;
const START = "2026-05-10T14:00:00";
const END = "2026-05-10T17:00:00";
const NEW_START = "2026-05-10T15:00:00";
const NEW_END = "2026-05-10T18:00:00";
const PAID_AT = new Date("2026-05-10T15:30:00");
const CREATED_AT = new Date("2026-05-10T13:00:00");
const REQUESTED_AT = new Date("2026-05-10T16:00:00");

const createConfirmedOnline = (): Booking =>
  Booking.create({
    bandId: BAND_ID,
    bookingId: BOOKING_ID,
    createdAt: CREATED_AT,
    memberId: MEMBER_ID,
    paymentId: PAYMENT_ID,
    paymentMethod: PaymentMethod.ONLINE_CREDIT_CARD,
    pointsUsed: Point.create(POINTS_ZERO),
    roomId: ROOM_ID,
    timeSlot: TimeSlot.create(new Date(START), new Date(END)),
    totalAmount: Money.create(AMOUNT_5000),
  })
    .requestPayment()
    .confirmWithOnlinePayment(PAID_AT);

const createInUse = (): Booking => createConfirmedOnline().checkIn().startUse();

describe("Booking modification - BR-04", () => {
  it("should change timeSlot in CONFIRMED status", () => {
    const newSlot = TimeSlot.create(new Date(NEW_START), new Date(NEW_END));
    const modified = createConfirmedOnline().changeTimeSlot(newSlot, Money.create(AMOUNT_6000));
    expect(modified.timeSlot).toEqual(newSlot);
    expect(modified.totalAmount.amount).toBe(AMOUNT_6000);
  });

  it("should reject modification in TENTATIVE status", () => {
    const tentative = Booking.create({
      bandId: BAND_ID,
      bookingId: BOOKING_ID,
      createdAt: CREATED_AT,
      memberId: MEMBER_ID,
      paymentId: PAYMENT_ID,
      paymentMethod: PaymentMethod.ONLINE_CREDIT_CARD,
      pointsUsed: Point.create(POINTS_ZERO),
      roomId: ROOM_ID,
      timeSlot: TimeSlot.create(new Date(START), new Date(END)),
      totalAmount: Money.create(AMOUNT_5000),
    });
    const newSlot = TimeSlot.create(new Date(NEW_START), new Date(NEW_END));
    expect(() => tentative.changeTimeSlot(newSlot, Money.create(AMOUNT_6000))).toThrow(
      "Booking can only be modified in CONFIRMED status (BR-04)",
    );
  });

  it("should reject modification in IN_USE status", () => {
    const newSlot = TimeSlot.create(new Date(NEW_START), new Date(NEW_END));
    expect(() => createInUse().changeTimeSlot(newSlot, Money.create(AMOUNT_6000))).toThrow(
      "Booking can only be modified in CONFIRMED status (BR-04)",
    );
  });
});

describe("Booking addEquipment", () => {
  it("should add equipment and update totalAmount", () => {
    const updated = createConfirmedOnline().addEquipment(EQUIPMENT_ID, Money.create(AMOUNT_1000));
    expect(updated.addedEquipment).toContain(EQUIPMENT_ID);
    expect(updated.totalAmount.amount).toBe(AMOUNT_6000);
  });

  it("should reject adding equipment in non-CONFIRMED status", () => {
    expect(() => createInUse().addEquipment(EQUIPMENT_ID, Money.create(AMOUNT_1000))).toThrow(
      "Booking can only be modified in CONFIRMED status (BR-04)",
    );
  });
});

describe("Booking requestExtension", () => {
  it("should create extension request in IN_USE status", () => {
    const booking = createInUse().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    expect(booking.extensionRequest).not.toBeNull();
  });

  it("should reject extension request from non-IN_USE", () => {
    expect(() =>
      createConfirmedOnline().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT),
    ).toThrow();
  });

  it("should reject second extension request - BR-40", () => {
    const booking = createInUse().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    expect(() => booking.requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT)).toThrow(
      "Extension already requested for this booking (BR-40)",
    );
  });
});

describe("Booking approveExtension", () => {
  it("should update totalAmount on approval", () => {
    const booking = createInUse().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    const approved = booking.approveExtension(Money.create(HOURLY_RATE));
    expect(approved.totalAmount.amount).toBe(AMOUNT_7500);
  });

  it("should extend the timeSlot endTime", () => {
    const booking = createInUse().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    const originalEnd = booking.timeSlot.endTime.getTime();
    const approved = booking.approveExtension(Money.create(HOURLY_RATE));
    expect(approved.timeSlot.startTime).toEqual(booking.timeSlot.startTime);
    expect(approved.timeSlot.endTime.getTime()).toBeGreaterThan(originalEnd);
  });

  it("should reject when no pending extension", () => {
    expect(() => createInUse().approveExtension(Money.create(HOURLY_RATE))).toThrow(
      "No pending extension request to approve",
    );
  });
});

describe("Booking rejectExtension", () => {
  it("should reject the extension request", () => {
    const booking = createInUse().requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT);
    const rejected = booking.rejectExtension();
    expect(rejected.extensionRequest).not.toBeNull();
  });

  it("should reject when no pending extension", () => {
    expect(() => createInUse().rejectExtension()).toThrow("No pending extension request to reject");
  });

  it("should reject when extension already approved", () => {
    const booking = createInUse()
      .requestExtension(REQUEST_ID, EXTRA_MINUTES_30, REQUESTED_AT)
      .approveExtension(Money.create(HOURLY_RATE));
    expect(() => booking.rejectExtension()).toThrow("No pending extension request to reject");
  });
});

describe("Booking reconstitute", () => {
  it("should reconstitute from state", () => {
    const original = createConfirmedOnline();
    const reconstituted = Booking.reconstitute({
      addedEquipment: [...original.addedEquipment],
      bandId: original.bandId,
      bookingId: original.bookingId,
      createdAt: original.createdAt,
      extensionRequest: original.extensionRequest,
      memberId: original.memberId,
      payment: original.payment,
      roomId: original.roomId,
      status: original.status,
      timeSlot: original.timeSlot,
      totalAmount: original.totalAmount,
    });
    expect(reconstituted.bookingId).toBe(BOOKING_ID);
    expect(reconstituted.status).toBe(BookingStatus.CONFIRMED);
  });
});
