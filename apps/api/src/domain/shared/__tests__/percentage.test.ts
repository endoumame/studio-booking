import { Percentage } from "../percentage.js";

const ZERO = 0;
const HALF = 50;
const FULL = 100;
const OVER_MAX = 101;
const RATE_70 = 70;
const RATE_33 = 33;
const AMOUNT_10000 = 10_000;
const EXPECTED_7000 = 7000;
const NEGATIVE = -1;

describe(Percentage, () => {
  it("should create a valid Percentage", () => {
    const pct = Percentage.create(HALF);
    expect(pct.value).toBe(HALF);
  });

  it("should allow 0%", () => {
    const pct = Percentage.create(ZERO);
    expect(pct.value).toBe(ZERO);
  });

  it("should allow 100%", () => {
    const pct = Percentage.create(FULL);
    expect(pct.value).toBe(FULL);
  });

  it("should reject values below 0", () => {
    expect(() => Percentage.create(NEGATIVE)).toThrow();
  });

  it("should reject values above 100", () => {
    expect(() => Percentage.create(OVER_MAX)).toThrow();
  });

  it("should apply to an amount", () => {
    const pct = Percentage.create(RATE_70);
    const result = pct.applyToAmount(AMOUNT_10000);
    expect(result).toBe(EXPECTED_7000);
  });

  it("should round down when applying", () => {
    const pct = Percentage.create(RATE_33);
    const result = pct.applyToAmount(FULL);
    expect(result).toBe(RATE_33);
  });

  it("should check equality by value", () => {
    const first = Percentage.create(HALF);
    const same = Percentage.create(HALF);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });
});
