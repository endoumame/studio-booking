import { createEmail, emailEquals } from "../email.js";

const VALID_EMAIL = "user@example.com";
const ANOTHER_VALID_EMAIL = "other@example.com";
const MISSING_AT = "userexample.com";
const MISSING_DOMAIN = "user@";
const MISSING_TLD = "user@example";
const WITH_SPACES = "user @example.com";
const EMPTY_STRING = "";

describe(createEmail, () => {
  it("succeeds with a valid email", () => {
    const result = createEmail(VALID_EMAIL);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    expect(result._unsafeUnwrap().value).toBe(VALID_EMAIL);
  });

  it("fails when missing the @ symbol", () => {
    const result = createEmail(MISSING_AT);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails when missing the domain", () => {
    const result = createEmail(MISSING_DOMAIN);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails when missing the TLD", () => {
    const result = createEmail(MISSING_TLD);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails when containing spaces", () => {
    const result = createEmail(WITH_SPACES);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails with an empty string", () => {
    const result = createEmail(EMPTY_STRING);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe(emailEquals, () => {
  it("returns true for identical emails", () => {
    const left = createEmail(VALID_EMAIL)._unsafeUnwrap();
    const right = createEmail(VALID_EMAIL)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(emailEquals(left, right)).toStrictEqual(true);
  });

  it("returns false for different emails", () => {
    const left = createEmail(VALID_EMAIL)._unsafeUnwrap();
    const right = createEmail(ANOTHER_VALID_EMAIL)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(emailEquals(left, right)).toStrictEqual(false);
  });
});
