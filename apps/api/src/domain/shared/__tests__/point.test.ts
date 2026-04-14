import { addPoints, createPoint, pointEquals, pointToMoney, subtractPoints } from "../point.js";

const VALID_VALUE = 500;
const ZERO_VALUE = 0;
const NEGATIVE_VALUE = -1;
const DECIMAL_VALUE = 3.5;
const LEFT_VALUE = 300;
const RIGHT_VALUE = 200;
const EXPECTED_SUM = 500;
const EXPECTED_DIFFERENCE = 100;
const EQUAL_VALUE = 50;
const DIFFERENT_VALUE = 75;

describe(createPoint, () => {
  it("succeeds with a valid positive integer", () => {
    const result = createPoint(VALID_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(VALID_VALUE);
  });

  it("succeeds with zero", () => {
    const result = createPoint(ZERO_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(ZERO_VALUE);
  });

  it("fails with a negative value", () => {
    const result = createPoint(NEGATIVE_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with a decimal value", () => {
    const result = createPoint(DECIMAL_VALUE);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(addPoints, () => {
  it("adds two Point values", () => {
    const left = createPoint(LEFT_VALUE)._unsafeUnwrap();
    const right = createPoint(RIGHT_VALUE)._unsafeUnwrap();
    const sum = addPoints(left, right);
    expect(sum.value).toBe(EXPECTED_SUM);
  });
});

describe(subtractPoints, () => {
  it("subtracts when result is non-negative", () => {
    const left = createPoint(LEFT_VALUE)._unsafeUnwrap();
    const right = createPoint(RIGHT_VALUE)._unsafeUnwrap();
    const result = subtractPoints(left, right);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(EXPECTED_DIFFERENCE);
  });

  it("fails when result would be negative", () => {
    const left = createPoint(RIGHT_VALUE)._unsafeUnwrap();
    const right = createPoint(LEFT_VALUE)._unsafeUnwrap();
    const result = subtractPoints(left, right);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(pointToMoney, () => {
  it("converts point value to money amount in JPY", () => {
    const point = createPoint(VALID_VALUE)._unsafeUnwrap();
    const money = pointToMoney(point);
    expect(money.amount).toBe(VALID_VALUE);
    expect(money.currency).toBe("JPY");
  });
});

describe(pointEquals, () => {
  it("returns true for equal values", () => {
    const left = createPoint(EQUAL_VALUE)._unsafeUnwrap();
    const right = createPoint(EQUAL_VALUE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(pointEquals(left, right)).toStrictEqual(true);
  });

  it("returns false for different values", () => {
    const left = createPoint(EQUAL_VALUE)._unsafeUnwrap();
    const right = createPoint(DIFFERENT_VALUE)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(pointEquals(left, right)).toStrictEqual(false);
  });
});
