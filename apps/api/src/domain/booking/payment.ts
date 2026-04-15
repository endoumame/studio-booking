import type { PaymentId, PaymentMethodType, PaymentStatusType } from "@my-app/shared";
import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Money } from "../shared/money.js";
import { PaymentStatus } from "@my-app/shared";
import type { Point } from "../shared/point.js";
import type { Result } from "neverthrow";
import { invalidState } from "../shared/errors.js";

interface Payment {
  readonly paymentId: PaymentId;
  readonly amount: Money;
  readonly method: PaymentMethodType;
  readonly pointsUsed: Point;
  readonly status: PaymentStatusType;
  readonly paidAt: Date | null;
}

interface CreatePaymentProps {
  readonly paymentId: PaymentId;
  readonly amount: Money;
  readonly method: PaymentMethodType;
  readonly pointsUsed: Point;
}

const createPayment = (props: CreatePaymentProps): Payment => ({
  amount: props.amount,
  method: props.method,
  paidAt: null,
  paymentId: props.paymentId,
  pointsUsed: props.pointsUsed,
  status: PaymentStatus.PENDING,
});

const completePayment = (payment: Payment, paidAt: Date): Result<Payment, DomainError> => {
  if (payment.status !== PaymentStatus.PENDING) {
    return err(invalidState("Payment must be pending to complete"));
  }
  return ok({ ...payment, paidAt, status: PaymentStatus.COMPLETED });
};

const refundPayment = (payment: Payment): Result<Payment, DomainError> => {
  if (payment.status !== PaymentStatus.COMPLETED) {
    return err(invalidState("Payment must be completed to refund"));
  }
  return ok({ ...payment, status: PaymentStatus.REFUNDED });
};

const withPaymentAmount = (payment: Payment, newAmount: Money): Payment => ({
  ...payment,
  amount: newAmount,
});

export { completePayment, createPayment, refundPayment, withPaymentAmount };
export type { CreatePaymentProps, Payment };
