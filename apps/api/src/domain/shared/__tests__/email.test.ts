import { Email } from "../email.js";

describe(Email, () => {
  it("should create a valid Email", () => {
    const email = Email.create("tanaka@example.com");
    expect(email.value).toBe("tanaka@example.com");
  });

  it("should reject empty string", () => {
    expect(() => Email.create("")).toThrow();
  });

  it("should reject string without @", () => {
    expect(() => Email.create("invalid-email")).toThrow();
  });

  it("should reject string without domain", () => {
    expect(() => Email.create("user@")).toThrow();
  });

  it("should reject string without local part", () => {
    expect(() => Email.create("@example.com")).toThrow();
  });

  it("should check equality by value", () => {
    const first = Email.create("tanaka@example.com");
    const same = Email.create("tanaka@example.com");
    const different = Email.create("suzuki@example.com");
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(first.equals(different)).toBe(false);
  });
});
