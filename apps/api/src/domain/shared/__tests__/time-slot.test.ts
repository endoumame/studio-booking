import { TimeSlot } from "../time-slot.js";

const START = "2026-05-10T14:00:00";
const END_3H = "2026-05-10T17:00:00";
const END_30M = "2026-05-10T14:30:00";
const OVERLAP_START = "2026-05-10T16:00:00";
const OVERLAP_END = "2026-05-10T19:00:00";
const EXTENDED_END = "2026-05-10T17:30:00";
const DURATION_3H = 3;
const DURATION_30M = 30;

describe("TimeSlot creation", () => {
  it("should create a valid TimeSlot", () => {
    const slot = TimeSlot.create(new Date(START), new Date(END_3H));
    expect(slot.startTime).toEqual(new Date(START));
    expect(slot.endTime).toEqual(new Date(END_3H));
  });

  it("should reject when startTime >= endTime", () => {
    expect(() => TimeSlot.create(new Date(END_3H), new Date(START))).toThrow();
  });

  it("should reject when startTime equals endTime", () => {
    const time = new Date(START);
    expect(() => TimeSlot.create(time, time)).toThrow();
  });
});

describe("TimeSlot duration", () => {
  it("should calculate duration in hours", () => {
    const slot = TimeSlot.create(new Date(START), new Date(END_3H));
    expect(slot.durationHours()).toBe(DURATION_3H);
  });

  it("should calculate duration in minutes", () => {
    const slot = TimeSlot.create(new Date(START), new Date(END_30M));
    expect(slot.durationMinutes()).toBe(DURATION_30M);
  });
});

describe("TimeSlot overlap", () => {
  it("should detect overlapping slots", () => {
    const slot1 = TimeSlot.create(new Date(START), new Date(END_3H));
    const slot2 = TimeSlot.create(new Date(OVERLAP_START), new Date(OVERLAP_END));
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(slot1.overlapsWith(slot2)).toBe(true);
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(slot2.overlapsWith(slot1)).toBe(true);
  });

  it("should detect non-overlapping (adjacent) slots", () => {
    const slot1 = TimeSlot.create(new Date(START), new Date(END_3H));
    const slot2 = TimeSlot.create(new Date(END_3H), new Date(OVERLAP_END));
    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(slot1.overlapsWith(slot2)).toBe(false);
  });
});

describe("TimeSlot extension and equality", () => {
  it("should extend endTime", () => {
    const slot = TimeSlot.create(new Date(START), new Date(END_3H));
    const extended = slot.extendByMinutes(DURATION_30M);
    expect(extended.endTime).toEqual(new Date(EXTENDED_END));
    expect(extended.startTime).toEqual(slot.startTime);
  });

  it("should check equality by value", () => {
    const first = TimeSlot.create(new Date(START), new Date(END_3H));
    const same = TimeSlot.create(new Date(START), new Date(END_3H));
    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });
});
