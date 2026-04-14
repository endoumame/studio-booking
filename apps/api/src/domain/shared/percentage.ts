import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const MIN_VALUE = 0;
const MAX_VALUE = 100;
const DIVISOR = 100;

interface Percentage {
  readonly value: number;
}

const createPercentage = (value: number): Result<Percentage, DomainError> => {
  if (!Number.isInteger(value)) {
    return err(validation("Percentage must be an integer"));
  }
  if (value < MIN_VALUE || value > MAX_VALUE) {
    return err(validation("Percentage must be between 0 and 100"));
  }
  return ok({ value });
};

const applyPercentage = (pct: Percentage, amount: number): number =>
  Math.floor((amount * pct.value) / DIVISOR);

const percentageEquals = (left: Percentage, right: Percentage): boolean =>
  left.value === right.value;

export { applyPercentage, createPercentage, percentageEquals };
export type { Percentage };
