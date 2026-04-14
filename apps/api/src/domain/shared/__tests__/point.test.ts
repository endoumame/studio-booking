import { Point } from "../point.js";

const ZERO = 0;
const VAL_500 = 500;
const VAL_200 = 200;
const VAL_100 = 100;
const VAL_300 = 300;
const NEGATIVE = -1;
const FRACTIONAL = 1.5;

describe("Point creation", () => {
  it("should create a valid Point", () => {
    const point = Point.create(VAL_500);
    expect(point.value).toBe(VAL_500);
  });

  it("should create zero points", () => {
    const point = Point.create(ZERO);
    expect(point.value).toBe(ZERO);
  });

  it("should reject negative points", () => {
    expect(() => Point.create(NEGATIVE)).toThrow();
  });

  it("should reject non-integer points", () => {
    expect(() => Point.create(FRACTIONAL)).toThrow();
  });
});

describe("Point arithmetic and conversion", () => {
  it("should add points", () => {
    expect(Point.create(VAL_100).add(Point.create(VAL_200)).value).toBe(VAL_300);
  });

  it("should subtract points", () => {
    expect(Point.create(VAL_500).subtract(Point.create(VAL_200)).value).toBe(VAL_300);
  });

  it("should reject subtraction resulting in negative", () => {
    expect(() => Point.create(VAL_100).subtract(Point.create(VAL_200))).toThrow();
  });

  it("should convert to Money (1P = 1JPY)", () => {
    const money = Point.create(VAL_500).toMoney();
    expect(money.amount).toBe(VAL_500);
    expect(money.currency).toBe("JPY");
  });

  it("should check equality by value", () => {
    const first = Point.create(VAL_100);
    const same = Point.create(VAL_100);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });
});
