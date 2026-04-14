import { Money } from "./money.js";
import { Percentage } from "./percentage.js";

const MIN_DAYS = 0;

class CancellationRule {
  readonly daysBeforeBooking: number;
  readonly refundRate: Percentage;

  private constructor(daysBeforeBooking: number, refundRate: Percentage) {
    this.daysBeforeBooking = daysBeforeBooking;
    this.refundRate = refundRate;
  }

  static create(daysBeforeBooking: number, refundRateValue: number): CancellationRule {
    if (!Number.isInteger(daysBeforeBooking) || daysBeforeBooking < MIN_DAYS) {
      throw new RangeError("daysBeforeBooking must be a non-negative integer");
    }
    const refundRate = Percentage.create(refundRateValue);
    return new CancellationRule(daysBeforeBooking, refundRate);
  }

  calculateRefund(totalAmount: Money): Money {
    const refundAmount = this.refundRate.applyToAmount(totalAmount.amount);
    return Money.create(refundAmount);
  }

  equals(other: CancellationRule): boolean {
    return (
      this.daysBeforeBooking === other.daysBeforeBooking && this.refundRate.equals(other.refundRate)
    );
  }
}

export { CancellationRule };
