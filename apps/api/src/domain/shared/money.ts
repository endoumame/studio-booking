import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const CURRENCY = "JPY" as const;
const MIN_AMOUNT = 0;

interface Money {
  readonly amount: number;
  readonly currency: typeof CURRENCY;
}

const createMoney = (amount: number): Result<Money, DomainError> => {
  if (!Number.isInteger(amount)) {
    return err(validation("Money amount must be an integer"));
  }
  if (amount < MIN_AMOUNT) {
    return err(validation("Money amount must not be negative"));
  }
  return ok({ amount, currency: CURRENCY });
};

const addMoney = (left: Money, right: Money): Money => ({
  amount: left.amount + right.amount,
  currency: CURRENCY,
});

const subtractMoney = (left: Money, right: Money): Result<Money, DomainError> => {
  const result = left.amount - right.amount;
  if (result < MIN_AMOUNT) {
    return err(validation("Money subtraction would result in negative"));
  }
  return ok({ amount: result, currency: CURRENCY });
};

const multiplyMoney = (money: Money, factor: number): Money => ({
  amount: Math.floor(money.amount * factor),
  currency: CURRENCY,
});

const moneyEquals = (left: Money, right: Money): boolean => left.amount === right.amount;

export { addMoney, createMoney, moneyEquals, multiplyMoney, subtractMoney };
export type { Money };
