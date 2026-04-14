import { Money } from "./money.js";

const MIN_VALUE = 0;

class Point {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Point {
    if (!Number.isInteger(value)) {
      throw new TypeError("Point value must be an integer");
    }
    if (value < MIN_VALUE) {
      throw new RangeError("Point value must not be negative");
    }
    return new Point(value);
  }

  add(other: Point): Point {
    return Point.create(this.value + other.value);
  }

  subtract(other: Point): Point {
    return Point.create(this.value - other.value);
  }

  toMoney(): Money {
    return Money.create(this.value);
  }

  equals(other: Point): boolean {
    return this.value === other.value;
  }
}

export { Point };
