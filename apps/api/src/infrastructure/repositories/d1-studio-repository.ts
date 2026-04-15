import type { EquipmentId, RoomId, StudioId } from "@my-app/shared";
import { err, ok } from "neverthrow";
import { toEquipmentId, toPolicyId, toRoomId, toStudioId } from "../brand-helpers.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Equipment } from "../../domain/studio/equipment.js";
import type { Result } from "neverthrow";
import type { Room } from "../../domain/studio/room.js";
import type { Studio } from "../../domain/studio/studio.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";
import { conflict } from "../../domain/shared/errors.js";

const CURRENCY = "JPY" as const;

interface StudioRow {
  readonly studio_id: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zip_code: string;
  readonly policy_id: string;
}

interface RoomRow {
  readonly room_id: string;
  readonly studio_id: string;
  readonly name: string;
  readonly capacity: number;
  readonly hourly_rate: number;
}

interface EquipmentRow {
  readonly equipment_id: string;
  readonly room_id: string;
  readonly name: string;
  readonly rental_fee: number;
}

interface CancellationRuleRow {
  readonly policy_id: string;
  readonly days_before_booking: number;
  readonly refund_rate: number;
}

const mapEquipmentRow = (row: EquipmentRow): Equipment => ({
  equipmentId: toEquipmentId(row.equipment_id),
  name: row.name,
  rentalFee: { amount: row.rental_fee, currency: CURRENCY },
});

const mapRoomRow = (row: RoomRow, equipment: readonly Equipment[]): Room => ({
  capacity: row.capacity,
  equipment,
  hourlyRate: { amount: row.hourly_rate, currency: CURRENCY },
  name: row.name,
  roomId: toRoomId(row.room_id),
});

const ROOMS_SQL = "SELECT * FROM rooms WHERE studio_id = ?";
const EQUIPMENT_BY_ROOM_SQL = "SELECT * FROM equipment WHERE room_id = ?";
const RULES_SQL = "SELECT * FROM cancellation_rules WHERE policy_id = ?";

interface BuildStudioParams {
  readonly db: D1Database;
  readonly studioRow: StudioRow;
}

const loadRoomWithEquipment = async (db: D1Database, row: RoomRow): Promise<Room> => {
  const eqResult = await db.prepare(EQUIPMENT_BY_ROOM_SQL).bind(row.room_id).all<EquipmentRow>();
  return mapRoomRow(row, eqResult.results.map(mapEquipmentRow));
};

const buildStudio = async (params: BuildStudioParams): Promise<Studio> => {
  const row = params.studioRow;
  const roomResult = await params.db.prepare(ROOMS_SQL).bind(row.studio_id).all<RoomRow>();
  const rooms = await Promise.all(
    roomResult.results.map(async (roomRow) => {
      const room = await loadRoomWithEquipment(params.db, roomRow);
      return room;
    }),
  );
  const rulesResult = await params.db
    .prepare(RULES_SQL)
    .bind(row.policy_id)
    .all<CancellationRuleRow>();
  const rules = rulesResult.results.map((ruleRow) => ({
    daysBeforeBooking: ruleRow.days_before_booking,
    refundRate: { value: ruleRow.refund_rate },
  }));
  return {
    address: {
      city: row.city,
      prefecture: row.prefecture,
      street: row.street,
      zipCode: row.zip_code,
    },
    cancellationPolicy: { policyId: toPolicyId(row.policy_id), rules },
    name: row.name,
    rooms,
    studioId: toStudioId(row.studio_id),
  };
};

const FIND_STUDIO_SQL = "SELECT * FROM studios WHERE studio_id = ?";

const findStudioById = async (
  db: D1Database,
  id: string,
): Promise<Result<Studio | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_STUDIO_SQL).bind(id).first<StudioRow>();
    if (row === null) {
      return ok(null);
    }
    const studio = await buildStudio({ db, studioRow: row });
    return ok(studio);
  } catch {
    return err(conflict("Failed to find studio"));
  }
};

const FIND_ROOM_SQL = "SELECT * FROM rooms WHERE room_id = ?";

const findRoomById = async (
  db: D1Database,
  id: string,
): Promise<Result<Room | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_ROOM_SQL).bind(id).first<RoomRow>();
    if (row === null) {
      return ok(null);
    }
    const room = await loadRoomWithEquipment(db, row);
    return ok(room);
  } catch {
    return err(conflict("Failed to find room"));
  }
};

const FIND_EQUIPMENT_SQL = "SELECT * FROM equipment WHERE equipment_id = ?";

const findEquipmentById = async (
  db: D1Database,
  id: string,
): Promise<Result<Equipment | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_EQUIPMENT_SQL).bind(id).first<EquipmentRow>();
    return ok(row === null ? null : mapEquipmentRow(row));
  } catch {
    return err(conflict("Failed to find equipment"));
  }
};

const UPSERT_STUDIO_SQL = `INSERT INTO studios (studio_id, name, prefecture, city, street, zip_code, policy_id)
VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(studio_id) DO UPDATE SET name=?, prefecture=?, city=?, street=?, zip_code=?, policy_id=?`;

const buildStudioBindings = (studio: Studio): readonly unknown[] => [
  studio.studioId,
  studio.name,
  studio.address.prefecture,
  studio.address.city,
  studio.address.street,
  studio.address.zipCode,
  studio.cancellationPolicy.policyId,
  studio.name,
  studio.address.prefecture,
  studio.address.city,
  studio.address.street,
  studio.address.zipCode,
  studio.cancellationPolicy.policyId,
];

const UPSERT_ROOM_SQL = `INSERT INTO rooms (room_id, studio_id, name, capacity, hourly_rate)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(room_id) DO UPDATE SET name=?, capacity=?, hourly_rate=?`;

const buildRoomStmt = (db: D1Database, room: Room, studioId: string): D1PreparedStatement =>
  db
    .prepare(UPSERT_ROOM_SQL)
    .bind(
      room.roomId,
      studioId,
      room.name,
      room.capacity,
      room.hourlyRate.amount,
      room.name,
      room.capacity,
      room.hourlyRate.amount,
    );

const UPSERT_EQUIPMENT_SQL = `INSERT INTO equipment (equipment_id, room_id, name, rental_fee)
VALUES (?, ?, ?, ?)
ON CONFLICT(equipment_id) DO UPDATE SET name=?, rental_fee=?`;

const buildEquipmentStmt = (db: D1Database, eq: Equipment, roomId: string): D1PreparedStatement =>
  db
    .prepare(UPSERT_EQUIPMENT_SQL)
    .bind(eq.equipmentId, roomId, eq.name, eq.rentalFee.amount, eq.name, eq.rentalFee.amount);

const collectEquipmentStmts = (db: D1Database, rooms: readonly Room[]): D1PreparedStatement[] =>
  rooms.flatMap((room) => room.equipment.map((eq) => buildEquipmentStmt(db, eq, room.roomId)));

const saveStudio = async (db: D1Database, studio: Studio): Promise<Result<null, DomainError>> => {
  try {
    const studioStmt = db.prepare(UPSERT_STUDIO_SQL).bind(...buildStudioBindings(studio));
    const roomStmts = studio.rooms.map((room) => buildRoomStmt(db, room, studio.studioId));
    const eqStmts = collectEquipmentStmts(db, studio.rooms);
    await db.batch([studioStmt, ...roomStmts, ...eqStmts]);
    // oxlint-disable-next-line typescript-eslint/no-invalid-void-type, typescript-eslint/no-unsafe-type-assertion
    return ok(null);
  } catch {
    return err(conflict("Failed to save studio"));
  }
};

const createD1StudioRepository = (db: D1Database): StudioRepository => ({
  findById: async (id: StudioId): Promise<Result<Studio | null, DomainError>> => {
    const result = await findStudioById(db, id);
    return result;
  },
  findEquipmentById: async (id: EquipmentId): Promise<Result<Equipment | null, DomainError>> => {
    const result = await findEquipmentById(db, id);
    return result;
  },
  findRoomById: async (id: RoomId): Promise<Result<Room | null, DomainError>> => {
    const result = await findRoomById(db, id);
    return result;
  },
  save: async (studio: Studio): Promise<Result<null, DomainError>> => {
    const result = await saveStudio(db, studio);
    return result;
  },
});

export { createD1StudioRepository };
