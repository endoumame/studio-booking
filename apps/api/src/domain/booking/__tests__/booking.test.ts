import type { BandId, BookingId, MemberId, PaymentId, RoomId } from "@my-app/shared";
import { BookingStatus, PaymentMethod, PaymentStatus } from "@my-app/shared";
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
const AMOUNT_5000 = 5000;
const POINTS_ZERO = 0;
const START = "2026-05-10T14:00:00";
const END = "2026-05-10T17:00:00";
const PAID_AT = new Date("2026-05-10T15:30:00");
const CREATED_AT = new Date("2026-05-10T13:00:00");

const createOnlineBooking = (): Booking =>
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
  });

const createOnSiteBooking = (): Booking =>
  Booking.create({
    bandId: null,
    bookingId: BOOKING_ID,
    createdAt: CREATED_AT,
    memberId: MEMBER_ID,
    paymentId: PAYMENT_ID,
    paymentMethod: PaymentMethod.ON_SITE_CASH,
    pointsUsed: Point.create(POINTS_ZERO),
    roomId: ROOM_ID,
    timeSlot: TimeSlot.create(new Date(START), new Date(END)),
    totalAmount: Money.create(AMOUNT_5000),
  });

const createConfirmedOnline = (): Booking =>
  createOnlineBooking().requestPayment().confirmWithOnlinePayment(PAID_AT);

const createInUse = (): Booking => createConfirmedOnline().checkIn().startUse();

describe("Booking creation", () => {
  it("should create in TENTATIVE status", () => {
    const booking = createOnlineBooking();
    expect(booking.status).toBe(BookingStatus.TENTATIVE);
    expect(booking.bookingId).toBe(BOOKING_ID);
    expect(booking.memberId).toBe(MEMBER_ID);
    expect(booking.roomId).toBe(ROOM_ID);
  });

  it("should set bandId when provided", () => {
    expect(createOnlineBooking().bandId).toBe(BAND_ID);
  });

  it("should allow null bandId", () => {
    expect(createOnSiteBooking().bandId).toBeNull();
  });

  it("should initialize with empty equipment and null extension", () => {
    const booking = createOnlineBooking();
    expect(booking.addedEquipment).toEqual([]);
    expect(booking.extensionRequest).toBeNull();
  });
});

describe("Booking online payment flow", () => {
  it("should transition TENTATIVE to AWAITING_PAYMENT", () => {
    expect(createOnlineBooking().requestPayment().status).toBe(BookingStatus.AWAITING_PAYMENT);
  });

  it("should transition AWAITING_PAYMENT to CONFIRMED", () => {
    const booking = createConfirmedOnline();
    expect(booking.status).toBe(BookingStatus.CONFIRMED);
    expect(booking.payment.status).toBe(PaymentStatus.COMPLETED);
  });

  it("should reject requestPayment for on-site payment", () => {
    expect(() => createOnSiteBooking().requestPayment()).toThrow(
      "Payment request is only for online payments",
    );
  });

  it("should reject confirmWithOnlinePayment from TENTATIVE", () => {
    expect(() => createOnlineBooking().confirmWithOnlinePayment(PAID_AT)).toThrow();
  });
});

describe("Booking on-site payment flow", () => {
  it("should transition TENTATIVE to CONFIRMED directly", () => {
    expect(createOnSiteBooking().confirmWithOnSitePayment().status).toBe(BookingStatus.CONFIRMED);
  });

  it("should reject on-site confirm for online payment", () => {
    expect(() => createOnlineBooking().confirmWithOnSitePayment()).toThrow(
      "On-site confirmation requires on-site payment method",
    );
  });

  it("should reject on-site confirm from non-TENTATIVE", () => {
    const confirmed = createOnSiteBooking().confirmWithOnSitePayment();
    expect(() => confirmed.confirmWithOnSitePayment()).toThrow();
  });
});

describe("Booking cancel from allowed statuses", () => {
  it("should cancel from TENTATIVE", () => {
    expect(createOnlineBooking().cancel().status).toBe(BookingStatus.CANCELLED);
  });

  it("should cancel from AWAITING_PAYMENT", () => {
    expect(createOnlineBooking().requestPayment().cancel().status).toBe(BookingStatus.CANCELLED);
  });

  it("should cancel from CONFIRMED", () => {
    expect(createConfirmedOnline().cancel().status).toBe(BookingStatus.CANCELLED);
  });

  it("should cancel from CHECKED_IN", () => {
    expect(createConfirmedOnline().checkIn().cancel().status).toBe(BookingStatus.CANCELLED);
  });
});

describe("Booking cancel from disallowed statuses", () => {
  it("should not cancel from IN_USE", () => {
    expect(() => createInUse().cancel()).toThrow("Cannot cancel booking in IN_USE status");
  });

  it("should not cancel from COMPLETED", () => {
    const completed = createInUse().complete(PAID_AT);
    expect(() => completed.cancel()).toThrow("Cannot cancel booking in COMPLETED status");
  });

  it("should not cancel from CANCELLED", () => {
    const cancelled = createOnlineBooking().cancel();
    expect(() => cancelled.cancel()).toThrow("Cannot cancel booking in CANCELLED status");
  });
});

describe("Booking check-in flow", () => {
  it("should transition CONFIRMED to CHECKED_IN", () => {
    expect(createConfirmedOnline().checkIn().status).toBe(BookingStatus.CHECKED_IN);
  });

  it("should transition CHECKED_IN to IN_USE", () => {
    expect(createConfirmedOnline().checkIn().startUse().status).toBe(BookingStatus.IN_USE);
  });

  it("should reject checkIn from TENTATIVE", () => {
    expect(() => createOnlineBooking().checkIn()).toThrow();
  });

  it("should reject startUse from CONFIRMED", () => {
    expect(() => createConfirmedOnline().startUse()).toThrow();
  });
});

describe("Booking complete", () => {
  it("should transition IN_USE to COMPLETED", () => {
    expect(createInUse().complete(PAID_AT).status).toBe(BookingStatus.COMPLETED);
  });

  it("should complete pending on-site payment on completion", () => {
    const onSite = createOnSiteBooking().confirmWithOnSitePayment();
    const completed = onSite.checkIn().startUse().complete(PAID_AT);
    expect(completed.payment.status).toBe(PaymentStatus.COMPLETED);
  });

  it("should preserve already completed payment status", () => {
    expect(createInUse().complete(PAID_AT).payment.status).toBe(PaymentStatus.COMPLETED);
  });

  it("should reject complete from non-IN_USE", () => {
    expect(() => createConfirmedOnline().complete(PAID_AT)).toThrow();
  });
});

describe("Booking isTerminal", () => {
  it("should return true for COMPLETED", () => {
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(createInUse().complete(PAID_AT).isTerminal()).toBe(true);
  });

  it("should return true for CANCELLED", () => {
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(createOnlineBooking().cancel().isTerminal()).toBe(true);
  });

  it("should return false for TENTATIVE", () => {
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(createOnlineBooking().isTerminal()).toBe(false);
  });

  it("should return false for CONFIRMED", () => {
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(createConfirmedOnline().isTerminal()).toBe(false);
  });
});
