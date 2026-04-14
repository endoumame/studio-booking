import { PaymentMethod, PaymentStatus } from "@my-app/shared";
import { Money } from "../../shared/money.js";
import { Payment } from "../payment.js";
import type { PaymentId } from "@my-app/shared";
import { Point } from "../../shared/point.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const PAYMENT_ID = "PAY-001" as PaymentId;
const AMOUNT_5000 = 5000;
const AMOUNT_3000 = 3000;
const POINTS_ZERO = 0;
const PAID_AT = new Date("2026-05-10T15:30:00");

const createOnlinePayment = (): Payment =>
  Payment.create({
    amount: Money.create(AMOUNT_5000),
    method: PaymentMethod.ONLINE_CREDIT_CARD,
    paidAt: null,
    paymentId: PAYMENT_ID,
    pointsUsed: Point.create(POINTS_ZERO),
    status: PaymentStatus.PENDING,
  });

const createOnSiteCashPayment = (): Payment =>
  Payment.create({
    amount: Money.create(AMOUNT_5000),
    method: PaymentMethod.ON_SITE_CASH,
    paidAt: null,
    paymentId: PAYMENT_ID,
    pointsUsed: Point.create(POINTS_ZERO),
    status: PaymentStatus.PENDING,
  });

const createOnSiteCardPayment = (): Payment =>
  Payment.create({
    amount: Money.create(AMOUNT_5000),
    method: PaymentMethod.ON_SITE_CARD,
    paidAt: null,
    paymentId: PAYMENT_ID,
    pointsUsed: Point.create(POINTS_ZERO),
    status: PaymentStatus.PENDING,
  });

describe("Payment creation", () => {
  it("should create a payment with given props", () => {
    const payment = createOnlinePayment();
    expect(payment.paymentId).toBe(PAYMENT_ID);
    expect(payment.amount.amount).toBe(AMOUNT_5000);
    expect(payment.method).toBe(PaymentMethod.ONLINE_CREDIT_CARD);
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.paidAt).toBeNull();
  });

  it("should create an on-site cash payment", () => {
    const payment = createOnSiteCashPayment();
    expect(payment.method).toBe(PaymentMethod.ON_SITE_CASH);
    expect(payment.status).toBe(PaymentStatus.PENDING);
  });

  it("should create an on-site card payment", () => {
    const payment = createOnSiteCardPayment();
    expect(payment.method).toBe(PaymentMethod.ON_SITE_CARD);
  });
});

describe("Payment isOnline and isOnSite", () => {
  it("should identify online credit card as online", () => {
    const payment = createOnlinePayment();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(payment.isOnline()).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(payment.isOnSite()).toBe(false);
  });

  it("should identify on-site cash as on-site", () => {
    const payment = createOnSiteCashPayment();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(payment.isOnSite()).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(payment.isOnline()).toBe(false);
  });

  it("should identify on-site card as on-site", () => {
    const payment = createOnSiteCardPayment();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(payment.isOnSite()).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(payment.isOnline()).toBe(false);
  });
});

describe("Payment complete", () => {
  it("should transition to COMPLETED with paidAt", () => {
    const completed = createOnlinePayment().complete(PAID_AT);
    expect(completed.status).toBe(PaymentStatus.COMPLETED);
    expect(completed.paidAt).toEqual(PAID_AT);
  });

  it("should preserve other fields after completion", () => {
    const completed = createOnlinePayment().complete(PAID_AT);
    expect(completed.paymentId).toBe(PAYMENT_ID);
    expect(completed.amount.amount).toBe(AMOUNT_5000);
    expect(completed.method).toBe(PaymentMethod.ONLINE_CREDIT_CARD);
  });

  it("should reject completing an already completed payment", () => {
    const completed = createOnlinePayment().complete(PAID_AT);
    expect(() => completed.complete(PAID_AT)).toThrow("Payment is already completed");
  });
});

describe("Payment refund", () => {
  it("should transition to REFUNDED from COMPLETED", () => {
    const refunded = createOnlinePayment().complete(PAID_AT).refund();
    expect(refunded.status).toBe(PaymentStatus.REFUNDED);
  });

  it("should reject refunding a non-completed payment", () => {
    const payment = createOnlinePayment();
    expect(() => payment.refund()).toThrow("Can only refund completed payments");
  });
});

describe("Payment partialRefund", () => {
  it("should transition to PARTIAL_REFUNDED from COMPLETED", () => {
    const partial = createOnlinePayment().complete(PAID_AT).partialRefund();
    expect(partial.status).toBe(PaymentStatus.PARTIAL_REFUNDED);
  });

  it("should reject partial refund of non-completed payment", () => {
    const payment = createOnlinePayment();
    expect(() => payment.partialRefund()).toThrow("Can only refund completed payments");
  });
});

describe("Payment withAmount", () => {
  it("should return a new payment with updated amount", () => {
    const payment = createOnlinePayment();
    const updated = payment.withAmount(Money.create(AMOUNT_3000));
    expect(updated.amount.amount).toBe(AMOUNT_3000);
    expect(payment.amount.amount).toBe(AMOUNT_5000);
  });

  it("should preserve other fields", () => {
    const updated = createOnlinePayment().withAmount(Money.create(AMOUNT_3000));
    expect(updated.paymentId).toBe(PAYMENT_ID);
    expect(updated.method).toBe(PaymentMethod.ONLINE_CREDIT_CARD);
    expect(updated.status).toBe(PaymentStatus.PENDING);
  });
});
