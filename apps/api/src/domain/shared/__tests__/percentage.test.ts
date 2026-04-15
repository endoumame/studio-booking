import { applyPercentage, createPercentage, percentageEquals } from "../percentage.js";

const VALID_VALUE = 50;
const ZERO_VALUE = 0;
const MAX_VALUE = 100;
const NEGATIVE_VALUE = -1;
const OVER_MAX_VALUE = 101;
const DECIMAL_VALUE = 33.3;
const BASE_AMOUNT = 1000;
const EXPECTED_HALF = 500;
const EXPECTED_ZERO = 0;
const EXPECTED_FULL = 1000;
const THIRTY_PERCENT = 30;
const ODD_AMOUNT = 999;
const EXPECTED_FLOORED = 299;
const EQUAL_VALUE = 25;
const DIFFERENT_VALUE = 75;

describe(createPercentage, () => {
  it("succeeds with a value within range", () => {
    const result = createPercentage(VALID_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(VALID_VALUE);
  });

  it("succeeds with zero", () => {
    const result = createPercentage(ZERO_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(ZERO_VALUE);
  });

  it("succeeds with 100", () => {
    const result = createPercentage(MAX_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(MAX_VALUE);
  });

  it("fails with a negative value", () => {
    const result = createPercentage(NEGATIVE_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with a value above 100", () => {
    const result = createPercentage(OVER_MAX_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with a decimal value", () => {
    const result = createPercentage(DECIMAL_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(applyPercentage, () => {
  it("applies 50% to an amount", () => {
    const pct = createPercentage(VALID_VALUE)._unsafeUnwrap();
    expect(applyPercentage(pct, BASE_AMOUNT)).toBe(EXPECTED_HALF);
  });

  it("applies 0% and returns zero", () => {
    const pct = createPercentage(ZERO_VALUE)._unsafeUnwrap();
    expect(applyPercentage(pct, BASE_AMOUNT)).toBe(EXPECTED_ZERO);
  });

  it("applies 100% and returns the full amount", () => {
    const pct = createPercentage(MAX_VALUE)._unsafeUnwrap();
    expect(applyPercentage(pct, BASE_AMOUNT)).toBe(EXPECTED_FULL);
  });

  it("floors the result for non-even divisions", () => {
    const pct = createPercentage(THIRTY_PERCENT)._unsafeUnwrap();
    expect(applyPercentage(pct, ODD_AMOUNT)).toBe(EXPECTED_FLOORED);
  });
});

describe(percentageEquals, () => {
  it("returns true for equal values", () => {
    const left = createPercentage(EQUAL_VALUE)._unsafeUnwrap();
    const right = createPercentage(EQUAL_VALUE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(percentageEquals(left, right)).toStrictEqual(true);
  });

  it("returns false for different values", () => {
    const left = createPercentage(EQUAL_VALUE)._unsafeUnwrap();
    const right = createPercentage(DIFFERENT_VALUE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(percentageEquals(left, right)).toStrictEqual(false);
  });
});
