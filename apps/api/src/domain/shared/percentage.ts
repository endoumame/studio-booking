const MIN_VALUE = 0;
const MAX_VALUE = 100;
const DIVISOR = 100;

class Percentage {
  readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Percentage {
    if (!Number.isInteger(value)) {
      throw new TypeError("Percentage value must be an integer");
    }
    if (value < MIN_VALUE || value > MAX_VALUE) {
      throw new RangeError("Percentage value must be between 0 and 100");
    }
    return new Percentage(value);
  }

  applyToAmount(amount: number): number {
    return Math.floor((amount * this.value) / DIVISOR);
  }

  equals(other: Percentage): boolean {
    return this.value === other.value;
  }
}

export { Percentage };
