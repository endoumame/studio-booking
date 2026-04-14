import { Address } from "../address.js";

const VALID_PROPS = {
  city: "渋谷区",
  prefecture: "東京都",
  street: "神南1-2-3",
  zipCode: "150-0041",
} as const;

describe("Address creation", () => {
  it("should create a valid Address", () => {
    const address = Address.create({ ...VALID_PROPS });
    expect(address.prefecture).toBe(VALID_PROPS.prefecture);
    expect(address.city).toBe(VALID_PROPS.city);
    expect(address.street).toBe(VALID_PROPS.street);
    expect(address.zipCode).toBe(VALID_PROPS.zipCode);
  });

  it("should reject empty prefecture", () => {
    expect(() => Address.create({ ...VALID_PROPS, prefecture: "" })).toThrow();
  });

  it("should reject empty city", () => {
    expect(() => Address.create({ ...VALID_PROPS, city: "" })).toThrow();
  });
});

describe("Address equality", () => {
  it("should check equality by value", () => {
    const first = Address.create({ ...VALID_PROPS });
    const same = Address.create({ ...VALID_PROPS });
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });
});
