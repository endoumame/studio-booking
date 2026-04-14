import type { BandId, MemberId } from "@my-app/shared";

import { Band } from "../band.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const BAND_ID = "B-001" as BandId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const MEMBER_ID_1 = "M-001" as MemberId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const MEMBER_ID_2 = "M-002" as MemberId;
const INITIAL_MEMBER_COUNT = 0;
const ONE_MEMBER = 1;
const TWO_MEMBERS = 2;

describe("Band creation", () => {
  it("should create a band with no members", () => {
    const band = Band.create(BAND_ID, "The Rockers");

    expect(band.bandId).toBe(BAND_ID);
    expect(band.name).toBe("The Rockers");
    expect(band.members).toHaveLength(INITIAL_MEMBER_COUNT);
  });

  it("should reject empty name", () => {
    expect(() => Band.create(BAND_ID, "")).toThrow("Band name must not be empty");
  });

  it("should reject whitespace-only name", () => {
    expect(() => Band.create(BAND_ID, "   ")).toThrow("Band name must not be empty");
  });
});

describe("Band addMember", () => {
  it("should return a new band with the member added", () => {
    const band = Band.create(BAND_ID, "The Rockers");

    const updated = band.addMember(MEMBER_ID_1);

    expect(updated.members).toHaveLength(ONE_MEMBER);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(updated.hasMember(MEMBER_ID_1)).toBe(true);
  });

  it("should reject duplicate member", () => {
    const band = Band.create(BAND_ID, "The Rockers").addMember(MEMBER_ID_1);

    expect(() => band.addMember(MEMBER_ID_1)).toThrow("Member is already in the band");
  });
});

describe("Band removeMember", () => {
  it("should return a new band without the member", () => {
    const band = Band.create(BAND_ID, "The Rockers").addMember(MEMBER_ID_1).addMember(MEMBER_ID_2);

    const updated = band.removeMember(MEMBER_ID_1);

    expect(updated.members).toHaveLength(ONE_MEMBER);
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(updated.hasMember(MEMBER_ID_1)).toBe(false);
  });

  it("should throw when member is not in the band", () => {
    const band = Band.create(BAND_ID, "The Rockers");

    expect(() => band.removeMember(MEMBER_ID_1)).toThrow("Member is not in the band");
  });
});

describe("Band hasMember", () => {
  it("should return false for non-member", () => {
    const band = Band.create(BAND_ID, "The Rockers");

    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(band.hasMember(MEMBER_ID_1)).toBe(false);
  });

  it("should return true for existing member", () => {
    const band = Band.create(BAND_ID, "The Rockers").addMember(MEMBER_ID_1);

    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(band.hasMember(MEMBER_ID_1)).toBe(true);
  });
});

describe("Band addMember with multiple members", () => {
  it("should support adding multiple distinct members", () => {
    const band = Band.create(BAND_ID, "The Rockers").addMember(MEMBER_ID_1).addMember(MEMBER_ID_2);

    expect(band.members).toHaveLength(TWO_MEMBERS);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(band.hasMember(MEMBER_ID_1)).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(band.hasMember(MEMBER_ID_2)).toBe(true);
  });
});
