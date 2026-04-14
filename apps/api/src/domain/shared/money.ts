const CURRENCY = "JPY" as const;
const MIN_AMOUNT = 0;

class Money {
  readonly amount: number;
  readonly currency: typeof CURRENCY = CURRENCY;

  private constructor(amount: number) {
    this.amount = amount;
  }

  static create(amount: number): Money {
    if (!Number.isInteger(amount)) {
      throw new TypeError("Money amount must be an integer");
    }
    if (amount < MIN_AMOUNT) {
      throw new RangeError("Money amount must not be negative");
    }
    return new Money(amount);
  }

  add(other: Money): Money {
    return Money.create(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.create(this.amount - other.amount);
  }

  multiply(factor: number): Money {
    return Money.create(Math.floor(this.amount * factor));
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}

export { Money };
