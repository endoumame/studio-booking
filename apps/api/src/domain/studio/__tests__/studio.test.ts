import type { PolicyId, RoomId, StudioId } from "@my-app/shared";
import { Address } from "../../shared/address.js";
import { CancellationPolicy } from "../cancellation-policy.js";
import { CancellationRule } from "../../shared/cancellation-rule.js";
import { Money } from "../../shared/money.js";
import { Room } from "../room.js";
import { Studio } from "../studio.js";

const ZERO = 0;
const ONE = 1;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const STUDIO_ID = "S-001" as StudioId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ROOM_ID = "R-001" as RoomId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ROOM_ID_2 = "R-002" as RoomId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ROOM_ID_UNKNOWN = "R-999" as RoomId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const POLICY_ID = "P-001" as PolicyId;
const HOURLY_RATE = 3000;
const CAPACITY = 5;
const DAYS_BEFORE = 7;
const FULL_REFUND_RATE = 100;

const makeAddress = (): Address =>
  Address.create({
    city: "Shibuya",
    prefecture: "Tokyo",
    street: "1-1-1",
    zipCode: "150-0001",
  });

const makePolicy = (): CancellationPolicy => {
  const rule = CancellationRule.create(DAYS_BEFORE, FULL_REFUND_RATE);
  return CancellationPolicy.create({ policyId: POLICY_ID, rules: [rule] });
};

const makeRoom = (roomId: RoomId, name: string): Room =>
  Room.create({
    capacity: CAPACITY,
    equipment: [],
    hourlyRate: Money.create(HOURLY_RATE),
    name,
    roomId,
  });

describe("Studio creation", () => {
  it("should create a valid studio", () => {
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [],
      studioId: STUDIO_ID,
    });

    expect(studio.studioId).toBe(STUDIO_ID);
    expect(studio.name).toBe("Sound Studio");
    expect(studio.rooms).toHaveLength(ZERO);
  });

  it("should reject empty name", () => {
    expect(() =>
      Studio.create({
        address: makeAddress(),
        cancellationPolicy: makePolicy(),
        name: "",
        rooms: [],
        studioId: STUDIO_ID,
      }),
    ).toThrow("Studio name must not be empty");
  });
});

describe("Studio addRoom", () => {
  it("should add a room to the studio", () => {
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [],
      studioId: STUDIO_ID,
    });
    const room = makeRoom(ROOM_ID, "Room A");

    studio.addRoom(room);

    expect(studio.rooms).toHaveLength(ONE);
  });

  it("should reject duplicate room", () => {
    const room = makeRoom(ROOM_ID, "Room A");
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [room],
      studioId: STUDIO_ID,
    });

    expect(() => {
      studio.addRoom(room);
    }).toThrow("already exists");
  });
});

describe("Studio removeRoom", () => {
  it("should remove an existing room", () => {
    const room = makeRoom(ROOM_ID, "Room A");
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [room],
      studioId: STUDIO_ID,
    });

    studio.removeRoom(ROOM_ID);

    expect(studio.rooms).toHaveLength(ZERO);
  });

  it("should throw when room not found", () => {
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [],
      studioId: STUDIO_ID,
    });

    expect(() => {
      studio.removeRoom(ROOM_ID_UNKNOWN);
    }).toThrow("not found");
  });
});

describe("Studio findRoomById", () => {
  it("should find an existing room", () => {
    const room = makeRoom(ROOM_ID, "Room A");
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [room],
      studioId: STUDIO_ID,
    });

    const found = studio.findRoomById(ROOM_ID);
    expect(found?.roomId).toBe(ROOM_ID);
  });

  it("should return undefined when room does not exist", () => {
    const studio = Studio.create({
      address: makeAddress(),
      cancellationPolicy: makePolicy(),
      name: "Sound Studio",
      rooms: [],
      studioId: STUDIO_ID,
    });

    const found = studio.findRoomById(ROOM_ID_2);
    expect(found).toBeUndefined();
  });
});
