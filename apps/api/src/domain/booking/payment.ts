import { PaymentMethod, PaymentStatus } from "@my-app/shared";
import type { Money } from "../shared/money.js";
import type { PaymentId } from "@my-app/shared";
import type { Point } from "../shared/point.js";

interface PaymentProps {
  paymentId: PaymentId;
  amount: Money;
  method: PaymentMethod;
  pointsUsed: Point;
  status: PaymentStatus;
  paidAt: Date | null;
}

class Payment {
  readonly paymentId: PaymentId;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly pointsUsed: Point;
  readonly status: PaymentStatus;
  readonly paidAt: Date | null;

  private constructor(props: PaymentProps) {
    this.paymentId = props.paymentId;
    this.amount = props.amount;
    this.method = props.method;
    this.pointsUsed = props.pointsUsed;
    this.status = props.status;
    this.paidAt = props.paidAt;
  }

  static create(props: PaymentProps): Payment {
    return new Payment(props);
  }

  isOnline(): boolean {
    return this.method === PaymentMethod.ONLINE_CREDIT_CARD;
  }

  isOnSite(): boolean {
    return this.method === PaymentMethod.ON_SITE_CASH || this.method === PaymentMethod.ON_SITE_CARD;
  }

  complete(paidAt: Date): Payment {
    if (this.status === PaymentStatus.COMPLETED) {
      throw new Error("Payment is already completed");
    }
    return new Payment({
      ...this.toProps(),
      paidAt,
      status: PaymentStatus.COMPLETED,
    });
  }

  refund(): Payment {
    if (this.status !== PaymentStatus.COMPLETED) {
      throw new Error("Can only refund completed payments");
    }
    return new Payment({
      ...this.toProps(),
      status: PaymentStatus.REFUNDED,
    });
  }

  partialRefund(): Payment {
    if (this.status !== PaymentStatus.COMPLETED) {
      throw new Error("Can only refund completed payments");
    }
    return new Payment({
      ...this.toProps(),
      status: PaymentStatus.PARTIAL_REFUNDED,
    });
  }

  withAmount(newAmount: Money): Payment {
    return new Payment({
      ...this.toProps(),
      amount: newAmount,
    });
  }

  private toProps(): PaymentProps {
    return {
      amount: this.amount,
      method: this.method,
      paidAt: this.paidAt,
      paymentId: this.paymentId,
      pointsUsed: this.pointsUsed,
      status: this.status,
    };
  }
}

export { Payment };
export type { PaymentProps };
