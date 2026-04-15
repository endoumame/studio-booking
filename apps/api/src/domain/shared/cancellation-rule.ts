import { applyPercentage, createPercentage } from "./percentage.js";
import type { DomainError } from "./errors.js";
import type { Money } from "./money.js";
import type { Percentage } from "./percentage.js";
import type { Result } from "neverthrow";
import { err } from "neverthrow";
import { validation } from "./errors.js";

const MIN_DAYS = 0;

interface CancellationRule {
  readonly daysBeforeBooking: number;
  readonly refundRate: Percentage;
}

const createCancellationRule = (
  daysBeforeBooking: number,
  refundRateValue: number,
): Result<CancellationRule, DomainError> => {
  if (!Number.isInteger(daysBeforeBooking) || daysBeforeBooking < MIN_DAYS) {
    return err(validation("daysBeforeBooking must be a non-negative integer"));
  }
  return createPercentage(refundRateValue).map((refundRate) => ({
    daysBeforeBooking,
    refundRate,
  }));
};

const calculateRefund = (rule: CancellationRule, totalAmount: Money): Money => ({
  amount: applyPercentage(rule.refundRate, totalAmount.amount),
  currency: totalAmount.currency,
});

const cancellationRuleEquals = (left: CancellationRule, right: CancellationRule): boolean =>
  left.daysBeforeBooking === right.daysBeforeBooking &&
  left.refundRate.value === right.refundRate.value;

export { calculateRefund, cancellationRuleEquals, createCancellationRule };
export type { CancellationRule };
