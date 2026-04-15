import { addressEquals, createAddress } from "../address.js";

const VALID_PREFECTURE = "Tokyo";
const VALID_CITY = "Shibuya";
const VALID_STREET = "1-2-3 Dogenzaka";
const VALID_ZIP = "150-0043";
const EMPTY = "";
const ALT_PREFECTURE = "Osaka";

const VALID_PROPS = {
  city: VALID_CITY,
  prefecture: VALID_PREFECTURE,
  street: VALID_STREET,
  zipCode: VALID_ZIP,
};

describe("createAddress with valid input", () => {
  it("succeeds with all fields populated", () => {
    const result = createAddress(VALID_PROPS);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    const address = result._unsafeUnwrap();
    expect(address.prefecture).toBe(VALID_PREFECTURE);
    expect(address.city).toBe(VALID_CITY);
    expect(address.street).toBe(VALID_STREET);
    expect(address.zipCode).toBe(VALID_ZIP);
  });
});

describe("createAddress with empty fields", () => {
  it("fails with empty prefecture", () => {
    const result = createAddress({ ...VALID_PROPS, prefecture: EMPTY });
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with empty city", () => {
    const result = createAddress({ ...VALID_PROPS, city: EMPTY });
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with empty street", () => {
    const result = createAddress({ ...VALID_PROPS, street: EMPTY });
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with empty zipCode", () => {
    const result = createAddress({ ...VALID_PROPS, zipCode: EMPTY });
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(addressEquals, () => {
  it("returns true for identical addresses", () => {
    const left = createAddress(VALID_PROPS)._unsafeUnwrap();
    const right = createAddress(VALID_PROPS)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(addressEquals(left, right)).toStrictEqual(true);
  });

  it("returns false when any field differs", () => {
    const left = createAddress(VALID_PROPS)._unsafeUnwrap();
    const right = createAddress({
      ...VALID_PROPS,
      prefecture: ALT_PREFECTURE,
    })._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(addressEquals(left, right)).toStrictEqual(false);
  });
});
