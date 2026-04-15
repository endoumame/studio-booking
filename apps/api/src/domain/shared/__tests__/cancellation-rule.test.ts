import {
  calculateRefund,
  cancellationRuleEquals,
  createCancellationRule,
} from "../cancellation-rule.js";
import { createMoney } from "../money.js";

const VALID_DAYS = 7;
const ZERO_DAYS = 0;
const NEGATIVE_DAYS = -1;
const DECIMAL_DAYS = 2.5;
const FULL_REFUND_RATE = 100;
const HALF_REFUND_RATE = 50;
const ZERO_REFUND_RATE = 0;
const INVALID_REFUND_RATE = 150;
const TOTAL_AMOUNT = 10_000;
const EXPECTED_FULL_REFUND = 10_000;
const EXPECTED_HALF_REFUND = 5000;
const EXPECTED_ZERO_REFUND = 0;
const ALT_DAYS = 3;

describe("createCancellationRule with valid input", () => {
  it("succeeds with valid days and refund rate", () => {
    const result = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    const rule = result._unsafeUnwrap();
    expect(rule.daysBeforeBooking).toBe(VALID_DAYS);
    expect(rule.refundRate.value).toBe(FULL_REFUND_RATE);
  });

  it("succeeds with zero days", () => {
    const result = createCancellationRule(ZERO_DAYS, HALF_REFUND_RATE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().daysBeforeBooking).toBe(ZERO_DAYS);
  });
});

describe("createCancellationRule with invalid input", () => {
  it("fails with negative days", () => {
    const result = createCancellationRule(NEGATIVE_DAYS, FULL_REFUND_RATE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with decimal days", () => {
    const result = createCancellationRule(DECIMAL_DAYS, FULL_REFUND_RATE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with an invalid refund rate", () => {
    const result = createCancellationRule(VALID_DAYS, INVALID_REFUND_RATE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(calculateRefund, () => {
  it("returns full amount for 100% refund rate", () => {
    const rule = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    const total = createMoney(TOTAL_AMOUNT)._unsafeUnwrap();
    const refund = calculateRefund(rule, total);
    expect(refund.amount).toBe(EXPECTED_FULL_REFUND);
    expect(refund.currency).toBe("JPY");
  });

  it("returns half amount for 50% refund rate", () => {
    const rule = createCancellationRule(VALID_DAYS, HALF_REFUND_RATE)._unsafeUnwrap();
    const total = createMoney(TOTAL_AMOUNT)._unsafeUnwrap();
    const refund = calculateRefund(rule, total);
    expect(refund.amount).toBe(EXPECTED_HALF_REFUND);
  });

  it("returns zero for 0% refund rate", () => {
    const rule = createCancellationRule(VALID_DAYS, ZERO_REFUND_RATE)._unsafeUnwrap();
    const total = createMoney(TOTAL_AMOUNT)._unsafeUnwrap();
    const refund = calculateRefund(rule, total);
    expect(refund.amount).toBe(EXPECTED_ZERO_REFUND);
  });
});

describe(cancellationRuleEquals, () => {
  it("returns true for identical rules", () => {
    const left = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    const right = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(cancellationRuleEquals(left, right)).toStrictEqual(true);
  });

  it("returns false when days differ", () => {
    const left = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    const right = createCancellationRule(ALT_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(cancellationRuleEquals(left, right)).toStrictEqual(false);
  });

  it("returns false when refund rates differ", () => {
    const left = createCancellationRule(VALID_DAYS, FULL_REFUND_RATE)._unsafeUnwrap();
    const right = createCancellationRule(VALID_DAYS, HALF_REFUND_RATE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(cancellationRuleEquals(left, right)).toStrictEqual(false);
  });
});
