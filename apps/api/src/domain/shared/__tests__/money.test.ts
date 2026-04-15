import { addMoney, createMoney, moneyEquals, multiplyMoney, subtractMoney } from "../money.js";

const VALID_AMOUNT = 1500;
const ZERO_AMOUNT = 0;
const NEGATIVE_AMOUNT = -1;
const DECIMAL_AMOUNT = 10.5;
const LEFT_AMOUNT = 1000;
const RIGHT_AMOUNT = 500;
const EXPECTED_SUM = 1500;
const EXPECTED_DIFFERENCE = 500;
const FACTOR_TWO = 2;
const EXPECTED_DOUBLED = 3000;
const FRACTIONAL_FACTOR = 0.3;
const EXPECTED_FLOORED = 450;
const EQUAL_AMOUNT = 100;
const DIFFERENT_AMOUNT = 200;

describe(createMoney, () => {
  it("succeeds with a valid positive integer", () => {
    const result = createMoney(VALID_AMOUNT);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    const money = result._unsafeUnwrap();
    expect(money.amount).toBe(VALID_AMOUNT);
    expect(money.currency).toBe("JPY");
  });

  it("succeeds with zero", () => {
    const result = createMoney(ZERO_AMOUNT);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().amount).toBe(ZERO_AMOUNT);
  });

  it("fails with a negative amount", () => {
    const result = createMoney(NEGATIVE_AMOUNT);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with a decimal amount", () => {
    const result = createMoney(DECIMAL_AMOUNT);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(addMoney, () => {
  it("adds two Money values", () => {
    const left = createMoney(LEFT_AMOUNT)._unsafeUnwrap();
    const right = createMoney(RIGHT_AMOUNT)._unsafeUnwrap();
    const sum = addMoney(left, right);
    expect(sum.amount).toBe(EXPECTED_SUM);
    expect(sum.currency).toBe("JPY");
  });
});

describe(subtractMoney, () => {
  it("subtracts when result is non-negative", () => {
    const left = createMoney(LEFT_AMOUNT)._unsafeUnwrap();
    const right = createMoney(RIGHT_AMOUNT)._unsafeUnwrap();
    const result = subtractMoney(left, right);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().amount).toBe(EXPECTED_DIFFERENCE);
  });

  it("fails when result would be negative", () => {
    const left = createMoney(RIGHT_AMOUNT)._unsafeUnwrap();
    const right = createMoney(LEFT_AMOUNT)._unsafeUnwrap();
    const result = subtractMoney(left, right);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(multiplyMoney, () => {
  it("multiplies by an integer factor", () => {
    const money = createMoney(VALID_AMOUNT)._unsafeUnwrap();
    const result = multiplyMoney(money, FACTOR_TWO);
    expect(result.amount).toBe(EXPECTED_DOUBLED);
  });

  it("floors the result for fractional outcomes", () => {
    const money = createMoney(VALID_AMOUNT)._unsafeUnwrap();
    const result = multiplyMoney(money, FRACTIONAL_FACTOR);
    expect(result.amount).toBe(EXPECTED_FLOORED);
  });
});

describe(moneyEquals, () => {
  it("returns true for equal amounts", () => {
    const left = createMoney(EQUAL_AMOUNT)._unsafeUnwrap();
    const right = createMoney(EQUAL_AMOUNT)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(moneyEquals(left, right)).toStrictEqual(true);
  });

  it("returns false for different amounts", () => {
    const left = createMoney(EQUAL_AMOUNT)._unsafeUnwrap();
    const right = createMoney(DIFFERENT_AMOUNT)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(moneyEquals(left, right)).toStrictEqual(false);
  });
});
