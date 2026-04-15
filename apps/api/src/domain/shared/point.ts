import { err, ok } from "neverthrow";
import type { DomainError } from "./errors.js";
import type { Money } from "./money.js";
import type { Result } from "neverthrow";
import { validation } from "./errors.js";

const MIN_VALUE = 0;
const CURRENCY = "JPY" as const;

interface Point {
  readonly value: number;
}

const createPoint = (value: number): Result<Point, DomainError> => {
  if (!Number.isInteger(value)) {
    return err(validation("Point value must be an integer"));
  }
  if (value < MIN_VALUE) {
    return err(validation("Point value must not be negative"));
  }
  return ok({ value });
};

const addPoints = (left: Point, right: Point): Point => ({
  value: left.value + right.value,
});

const subtractPoints = (left: Point, right: Point): Result<Point, DomainError> => {
  const result = left.value - right.value;
  if (result < MIN_VALUE) {
    return err(validation("Insufficient points"));
  }
  return ok({ value: result });
};

const pointToMoney = (point: Point): Money => ({
  amount: point.value,
  currency: CURRENCY,
});

const pointEquals = (left: Point, right: Point): boolean => left.value === right.value;

export { addPoints, createPoint, pointEquals, pointToMoney, subtractPoints };
export type { Point };
