import { CancellationPolicy } from "../cancellation-policy.js";
import { CancellationRule } from "../../shared/cancellation-rule.js";
import { Money } from "../../shared/money.js";
import type { PolicyId } from "@my-app/shared";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const POLICY_ID = "P-001" as PolicyId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const OTHER_POLICY_ID = "P-002" as PolicyId;
const TOTAL_AMOUNT = 10_000;
const FULL_REFUND_RATE = 100;
const HALF_REFUND_RATE = 50;
const DAYS_BEFORE_30 = 30;
const DAYS_BEFORE_7 = 7;
const DAYS_BEFORE_3 = 3;
const DAYS_CANCEL_AT_35 = 35;
const DAYS_CANCEL_AT_15 = 15;
const DAYS_CANCEL_AT_1 = 1;
const EXPECTED_FULL_REFUND = 10_000;
const EXPECTED_HALF_REFUND = 5000;
const ZERO_REFUND = 0;
const ONE_RULE = 1;

describe("CancellationPolicy creation", () => {
  it("should create a policy with at least one rule", () => {
    const rule = CancellationRule.create(DAYS_BEFORE_7, FULL_REFUND_RATE);
    const policy = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule] });

    expect(policy.policyId).toBe(POLICY_ID);
    expect(policy.rules).toHaveLength(ONE_RULE);
  });

  it("should reject empty rules", () => {
    expect(() => CancellationPolicy.create({ policyId: POLICY_ID, rules: [] })).toThrow(
      "CancellationPolicy must have at least one rule",
    );
  });
});

describe("CancellationPolicy calculateRefund with closest rule (BR-32)", () => {
  it("should apply the closest rule whose daysBeforeBooking <= cancellation days", () => {
    const rule30 = CancellationRule.create(DAYS_BEFORE_30, FULL_REFUND_RATE);
    const rule7 = CancellationRule.create(DAYS_BEFORE_7, HALF_REFUND_RATE);
    const policy = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule30, rule7] });
    const total = Money.create(TOTAL_AMOUNT);

    const refund = policy.calculateRefund(total, DAYS_CANCEL_AT_35);
    expect(refund.amount).toBe(EXPECTED_FULL_REFUND);
  });

  it("should pick the rule with highest daysBeforeBooking that is still <= days", () => {
    const rule30 = CancellationRule.create(DAYS_BEFORE_30, FULL_REFUND_RATE);
    const rule7 = CancellationRule.create(DAYS_BEFORE_7, HALF_REFUND_RATE);
    const policy = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule30, rule7] });
    const total = Money.create(TOTAL_AMOUNT);

    const refund = policy.calculateRefund(total, DAYS_CANCEL_AT_15);
    expect(refund.amount).toBe(EXPECTED_HALF_REFUND);
  });
});

describe("CancellationPolicy fallback to zero refund", () => {
  it("should return zero refund when no rule applies", () => {
    const rule7 = CancellationRule.create(DAYS_BEFORE_7, FULL_REFUND_RATE);
    const rule3 = CancellationRule.create(DAYS_BEFORE_3, HALF_REFUND_RATE);
    const policy = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule7, rule3] });
    const total = Money.create(TOTAL_AMOUNT);

    const refund = policy.calculateRefund(total, DAYS_CANCEL_AT_1);
    expect(refund.amount).toBe(ZERO_REFUND);
  });
});

describe("CancellationPolicy equality", () => {
  it("should be equal when policyId matches", () => {
    const rule = CancellationRule.create(DAYS_BEFORE_7, FULL_REFUND_RATE);
    const first = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule] });
    const same = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule] });

    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });

  it("should not be equal when policyId differs", () => {
    const rule = CancellationRule.create(DAYS_BEFORE_7, FULL_REFUND_RATE);
    const first = CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule] });
    const other = CancellationPolicy.create({ policyId: OTHER_POLICY_ID, rules: [rule] });

    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(first.equals(other)).toBe(false);
  });
});
