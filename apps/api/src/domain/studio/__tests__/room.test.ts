import { Money } from "../../shared/money.js";
import { Room } from "../room.js";
import type { RoomId } from "@my-app/shared";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ROOM_ID = "R-001" as RoomId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const OTHER_ROOM_ID = "R-002" as RoomId;
const HOURLY_RATE = 3000;
const CAPACITY = 5;
const INVALID_CAPACITY_ZERO = 0;
const INVALID_CAPACITY_NEGATIVE = -1;
const INVALID_CAPACITY_FRACTION = 2.5;
const DURATION_HOURS = 3;
const EXPECTED_COST = 9000;

describe("Room creation", () => {
  it("should create a valid room", () => {
    const rate = Money.create(HOURLY_RATE);
    const room = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "Studio A",
      roomId: ROOM_ID,
    });

    expect(room.roomId).toBe(ROOM_ID);
    expect(room.name).toBe("Studio A");
    expect(room.capacity).toBe(CAPACITY);
    expect(room.hourlyRate).toBe(rate);
  });

  it("should reject empty name", () => {
    const rate = Money.create(HOURLY_RATE);

    expect(() =>
      Room.create({
        capacity: CAPACITY,
        equipment: [],
        hourlyRate: rate,
        name: "",
        roomId: ROOM_ID,
      }),
    ).toThrow("Room name must not be empty");
  });
});

describe("Room capacity validation", () => {
  it("should reject zero capacity", () => {
    const rate = Money.create(HOURLY_RATE);

    expect(() =>
      Room.create({
        capacity: INVALID_CAPACITY_ZERO,
        equipment: [],
        hourlyRate: rate,
        name: "A",
        roomId: ROOM_ID,
      }),
    ).toThrow("Room capacity must be a positive integer");
  });

  it("should reject negative capacity", () => {
    const rate = Money.create(HOURLY_RATE);

    expect(() =>
      Room.create({
        capacity: INVALID_CAPACITY_NEGATIVE,
        equipment: [],
        hourlyRate: rate,
        name: "A",
        roomId: ROOM_ID,
      }),
    ).toThrow("Room capacity must be a positive integer");
  });

  it("should reject fractional capacity", () => {
    const rate = Money.create(HOURLY_RATE);

    expect(() =>
      Room.create({
        capacity: INVALID_CAPACITY_FRACTION,
        equipment: [],
        hourlyRate: rate,
        name: "A",
        roomId: ROOM_ID,
      }),
    ).toThrow("Room capacity must be a positive integer");
  });
});

describe("Room calculateCost", () => {
  it("should multiply hourly rate by duration", () => {
    const rate = Money.create(HOURLY_RATE);
    const room = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "Studio A",
      roomId: ROOM_ID,
    });

    const cost = room.calculateCost(DURATION_HOURS);
    expect(cost.amount).toBe(EXPECTED_COST);
  });
});

describe("Room equality", () => {
  it("should be equal when roomId matches", () => {
    const rate = Money.create(HOURLY_RATE);
    const first = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "A",
      roomId: ROOM_ID,
    });
    const same = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "B",
      roomId: ROOM_ID,
    });

    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(first.equals(same)).toBe(true);
  });

  it("should not be equal when roomId differs", () => {
    const rate = Money.create(HOURLY_RATE);
    const first = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "A",
      roomId: ROOM_ID,
    });
    const other = Room.create({
      capacity: CAPACITY,
      equipment: [],
      hourlyRate: rate,
      name: "A",
      roomId: OTHER_ROOM_ID,
    });

    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(first.equals(other)).toBe(false);
  });
});
