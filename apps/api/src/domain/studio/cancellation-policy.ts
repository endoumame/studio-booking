import { CancellationRule } from "../shared/cancellation-rule.js";
import type { Money } from "../shared/money.js";
import type { PolicyId } from "@my-app/shared";

const MIN_RULES_LENGTH = 1;
const FIRST_INDEX = 0;
const NO_REFUND_RATE = 0;

interface CancellationPolicyProps {
  policyId: PolicyId;
  rules: CancellationRule[];
}

class CancellationPolicy {
  readonly policyId: PolicyId;
  readonly rules: readonly CancellationRule[];

  private constructor(props: CancellationPolicyProps) {
    this.policyId = props.policyId;
    this.rules = [...props.rules];
  }

  static create(props: CancellationPolicyProps): CancellationPolicy {
    if (props.rules.length < MIN_RULES_LENGTH) {
      throw new Error("CancellationPolicy must have at least one rule");
    }
    return new CancellationPolicy(props);
  }

  /**
   * BR-30: Cancellation refund is calculated based on CancellationPolicy's CancellationRule[]
   * BR-32: When multiple rules exist, apply the rule with the closest daysBeforeBooking
   *        to the cancellation date (i.e. the closest rule whose daysBeforeBooking <= daysBeforeBooking)
   */
  calculateRefund(totalAmount: Money, daysBeforeBooking: number): Money {
    const applicableRule = this.findClosestRule(daysBeforeBooking);
    return applicableRule.calculateRefund(totalAmount);
  }

  private findClosestRule(daysBeforeBooking: number): CancellationRule {
    const applicable = this.rules
      .filter((rule) => rule.daysBeforeBooking <= daysBeforeBooking)
      .toSorted((left, right) => right.daysBeforeBooking - left.daysBeforeBooking);

    return applicable.length > FIRST_INDEX
      ? applicable[FIRST_INDEX]
      : CancellationRule.create(daysBeforeBooking, NO_REFUND_RATE);
  }

  equals(other: CancellationPolicy): boolean {
    return this.policyId === other.policyId;
  }
}

export type { CancellationPolicyProps };
export { CancellationPolicy };
