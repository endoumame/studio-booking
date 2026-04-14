import { Money } from "../money.js";

const ZERO = 0;
const AMOUNT_1500 = 1500;
const AMOUNT_1000 = 1000;
const AMOUNT_500 = 500;
const AMOUNT_300 = 300;
const AMOUNT_200 = 200;
const AMOUNT_100 = 100;
const AMOUNT_2000 = 2000;
const AMOUNT_4500 = 4500;
const AMOUNT_700 = 700;
const MULTIPLIER = 3;
const NEGATIVE = -1;
const FRACTIONAL = 10.5;

describe("Money creation", () => {
  it("should create with positive amount", () => {
    const money = Money.create(AMOUNT_1500);
    expect(money.amount).toBe(AMOUNT_1500);
    expect(money.currency).toBe("JPY");
  });

  it("should create with zero amount", () => {
    const money = Money.create(ZERO);
    expect(money.amount).toBe(ZERO);
  });

  it("should reject negative amount", () => {
    expect(() => Money.create(NEGATIVE)).toThrow();
  });

  it("should reject non-integer amount", () => {
    expect(() => Money.create(FRACTIONAL)).toThrow();
  });
});

describe("Money arithmetic", () => {
  it("should add two Money values", () => {
    const result = Money.create(AMOUNT_1000).add(Money.create(AMOUNT_500));
    expect(result.amount).toBe(AMOUNT_1500);
  });

  it("should subtract Money values", () => {
    const result = Money.create(AMOUNT_1000).subtract(Money.create(AMOUNT_300));
    expect(result.amount).toBe(AMOUNT_700);
  });

  it("should reject subtraction resulting in negative", () => {
    expect(() => Money.create(AMOUNT_100).subtract(Money.create(AMOUNT_200))).toThrow();
  });

  it("should multiply by a scalar", () => {
    const result = Money.create(AMOUNT_1500).multiply(MULTIPLIER);
    expect(result.amount).toBe(AMOUNT_4500);
  });

  it("should check equality by value", () => {
    const first = Money.create(AMOUNT_1000);
    const same = Money.create(AMOUNT_1000);
    const different = Money.create(AMOUNT_2000);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(first.equals(different)).toBe(false);
  });
});
