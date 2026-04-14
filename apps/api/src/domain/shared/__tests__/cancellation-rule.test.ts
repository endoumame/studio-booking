import { CancellationRule } from "../cancellation-rule.js";
import { Money } from "../money.js";

const DAYS_7 = 7;
const RATE_100 = 100;
const RATE_70 = 70;
const RATE_101 = 101;
const AMOUNT_10000 = 10_000;
const REFUND_7000 = 7000;
const NEGATIVE = -1;

describe(CancellationRule, () => {
  it("should create a valid CancellationRule", () => {
    const rule = CancellationRule.create(DAYS_7, RATE_100);
    expect(rule.daysBeforeBooking).toBe(DAYS_7);
    expect(rule.refundRate.value).toBe(RATE_100);
  });

  it("should reject negative daysBeforeBooking", () => {
    expect(() => CancellationRule.create(NEGATIVE, RATE_100)).toThrow();
  });

  it("should reject invalid refundRate", () => {
    expect(() => CancellationRule.create(DAYS_7, RATE_101)).toThrow();
  });

  it("should calculate refund amount", () => {
    const rule = CancellationRule.create(DAYS_7, RATE_70);
    const totalAmount = Money.create(AMOUNT_10000);
    const refund = rule.calculateRefund(totalAmount);
    expect(refund.amount).toBe(REFUND_7000);
  });

  it("should check equality by value", () => {
    const first = CancellationRule.create(DAYS_7, RATE_100);
    const same = CancellationRule.create(DAYS_7, RATE_100);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });
});
