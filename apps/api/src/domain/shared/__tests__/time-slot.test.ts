import {
  createTimeSlot,
  durationHours,
  durationMinutes,
  extendByMinutes,
  overlaps,
  timeSlotEquals,
} from "../time-slot.js";

const BASE_TIME = new Date("2026-04-14T10:00:00Z");
const ONE_HOUR_LATER = new Date("2026-04-14T11:00:00Z");
const TWO_HOURS_LATER = new Date("2026-04-14T12:00:00Z");
const THREE_HOURS_LATER = new Date("2026-04-14T13:00:00Z");
const NINETY_MINUTES_LATER = new Date("2026-04-14T11:30:00Z");
const EXPECTED_SIXTY_MINUTES = 60;
const EXPECTED_ONE_HOUR = 1;
const EXPECTED_TWO_HOURS = 2;
const EXPECTED_ONE_TWENTY_MINUTES = 120;
const EXTENSION_MINUTES = 30;

describe(createTimeSlot, () => {
  it("succeeds when start is before end", () => {
    const result = createTimeSlot(BASE_TIME, ONE_HOUR_LATER);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isOk()).toStrictEqual(true);
    const slot = result._unsafeUnwrap();
    expect(slot.startTime).toStrictEqual(BASE_TIME);
    expect(slot.endTime).toStrictEqual(ONE_HOUR_LATER);
  });

  it("fails when start equals end", () => {
    const result = createTimeSlot(BASE_TIME, BASE_TIME);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });

  it("fails when start is after end", () => {
    const result = createTimeSlot(ONE_HOUR_LATER, BASE_TIME);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(result.isErr()).toStrictEqual(true);
  });
});

describe("durationMinutes and durationHours", () => {
  it("returns correct duration in minutes", () => {
    const slot = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    expect(durationMinutes(slot)).toBe(EXPECTED_SIXTY_MINUTES);
  });

  it("returns correct duration in hours", () => {
    const slot = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    expect(durationHours(slot)).toBe(EXPECTED_ONE_HOUR);
  });

  it("returns correct duration for a two-hour slot", () => {
    const slot = createTimeSlot(BASE_TIME, TWO_HOURS_LATER)._unsafeUnwrap();
    expect(durationHours(slot)).toBe(EXPECTED_TWO_HOURS);
    expect(durationMinutes(slot)).toBe(EXPECTED_ONE_TWENTY_MINUTES);
  });
});

describe(overlaps, () => {
  it("detects overlapping slots", () => {
    const slotA = createTimeSlot(BASE_TIME, TWO_HOURS_LATER)._unsafeUnwrap();
    const slotB = createTimeSlot(ONE_HOUR_LATER, THREE_HOURS_LATER)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(overlaps(slotA, slotB)).toStrictEqual(true);
  });

  it("returns false for adjacent non-overlapping slots", () => {
    const slotA = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    const slotB = createTimeSlot(ONE_HOUR_LATER, TWO_HOURS_LATER)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(overlaps(slotA, slotB)).toStrictEqual(false);
  });

  it("returns false for completely separate slots", () => {
    const slotA = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    const slotB = createTimeSlot(TWO_HOURS_LATER, THREE_HOURS_LATER)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(overlaps(slotA, slotB)).toStrictEqual(false);
  });
});

describe(extendByMinutes, () => {
  it("extends the end time by the given minutes", () => {
    const slot = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    const extended = extendByMinutes(slot, EXTENSION_MINUTES);
    expect(extended.startTime).toStrictEqual(BASE_TIME);
    expect(extended.endTime).toStrictEqual(NINETY_MINUTES_LATER);
  });
});

describe(timeSlotEquals, () => {
  it("returns true for identical slots", () => {
    const slotA = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    const slotB = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(timeSlotEquals(slotA, slotB)).toStrictEqual(true);
  });

  it("returns false for different slots", () => {
    const slotA = createTimeSlot(BASE_TIME, ONE_HOUR_LATER)._unsafeUnwrap();
    const slotB = createTimeSlot(BASE_TIME, TWO_HOURS_LATER)._unsafeUnwrap();
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(timeSlotEquals(slotA, slotB)).toStrictEqual(false);
  });
});
