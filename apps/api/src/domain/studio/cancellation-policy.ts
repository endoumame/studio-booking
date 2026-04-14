import { err, ok } from "neverthrow";
import type { CancellationRule } from "../shared/cancellation-rule.js";
import type { DomainError } from "../shared/errors.js";
import type { Money } from "../shared/money.js";
import type { PolicyId } from "@my-app/shared";
import type { Result } from "neverthrow";
import { calculateRefund } from "../shared/cancellation-rule.js";
import { validation } from "../shared/errors.js";

const MIN_RULES_LENGTH = 0;
const NO_REFUND_AMOUNT = 0;

interface CancellationPolicy {
  readonly policyId: PolicyId;
  readonly rules: readonly CancellationRule[];
}

interface CreateCancellationPolicyProps {
  readonly policyId: PolicyId;
  readonly rules: readonly CancellationRule[];
}

const createCancellationPolicy = (
  props: CreateCancellationPolicyProps,
): Result<CancellationPolicy, DomainError> => {
  if (props.rules.length === MIN_RULES_LENGTH) {
    return err(validation("Cancellation policy must have at least one rule"));
  }
  return ok({
    policyId: props.policyId,
    rules: [...props.rules],
  });
};

const findMatchingRule = (
  rules: readonly CancellationRule[],
  daysBeforeBooking: number,
): CancellationRule | null => {
  const sorted = [...rules].toSorted(
    (left, right) => right.daysBeforeBooking - left.daysBeforeBooking,
  );
  const match = sorted.find((rule) => daysBeforeBooking >= rule.daysBeforeBooking);
  return match ?? null;
};

const calculatePolicyRefund = (
  policy: CancellationPolicy,
  totalAmount: Money,
  daysBeforeBooking: number,
): Money => {
  const rule = findMatchingRule(policy.rules, daysBeforeBooking);
  if (rule === null) {
    return { amount: NO_REFUND_AMOUNT, currency: totalAmount.currency };
  }
  return calculateRefund(rule, totalAmount);
};

export { calculatePolicyRefund, createCancellationPolicy };
export type { CancellationPolicy, CreateCancellationPolicyProps };
