import type { EquipmentId, RoomId, StudioId } from "@my-app/shared";
import { toEquipmentId, toPolicyId, toRoomId, toStudioId } from "../brand-helpers.js";
import { Address } from "../../domain/shared/address.js";
import { CancellationPolicy } from "../../domain/studio/cancellation-policy.js";
import { CancellationRule } from "../../domain/shared/cancellation-rule.js";
import { Equipment } from "../../domain/studio/equipment.js";
import { Money } from "../../domain/shared/money.js";
import { Room } from "../../domain/studio/room.js";
import { Studio } from "../../domain/studio/studio.js";
import type { StudioRepository } from "../../domain/studio/studio-repository.js";

interface StudioRow {
  readonly studio_id: string;
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zip_code: string;
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
  readonly name: string;
  readonly rental_fee: number;
}

const DEFAULT_POLICY_ID = toPolicyId("default-policy");
const DEFAULT_REFUND_RATE = 100;
const DEFAULT_DAYS_BEFORE = 0;

const mapRowToRoom = (row: RoomRow): Room =>
  Room.create({
    capacity: row.capacity,
    equipment: [],
    hourlyRate: Money.create(row.hourly_rate),
    name: row.name,
    roomId: toRoomId(row.room_id),
  });

const mapRowToEquipment = (row: EquipmentRow): Equipment =>
  Equipment.create({
    equipmentId: toEquipmentId(row.equipment_id),
    name: row.name,
    rentalFee: Money.create(row.rental_fee),
  });

const mapRowToStudio = (studioRow: StudioRow, roomRows: RoomRow[]): Studio => {
  const address = Address.create({
    city: studioRow.city,
    prefecture: studioRow.prefecture,
    street: studioRow.street,
    zipCode: studioRow.zip_code,
  });

  const rooms = roomRows.map((row) => mapRowToRoom(row));
  const defaultRule = CancellationRule.create(DEFAULT_DAYS_BEFORE, DEFAULT_REFUND_RATE);
  const cancellationPolicy = CancellationPolicy.create({
    policyId: DEFAULT_POLICY_ID,
    rules: [defaultRule],
  });

  return Studio.create({
    address,
    cancellationPolicy,
    name: studioRow.name,
    rooms,
    studioId: toStudioId(studioRow.studio_id),
  });
};

class D1StudioRepository implements StudioRepository {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async save(studio: Studio): Promise<void> {
    const statements = this.buildSaveStatements(studio);
    await this.db.batch(statements);
  }

  async findById(id: StudioId): Promise<Studio | null> {
    const studioRow = await this.db
      .prepare("SELECT * FROM studios WHERE studio_id = ?")
      .bind(id)
      .first<StudioRow>();

    if (!studioRow) {
      return null;
    }

    const roomResult = await this.db
      .prepare("SELECT * FROM rooms WHERE studio_id = ?")
      .bind(id)
      .all<RoomRow>();

    return mapRowToStudio(studioRow, roomResult.results);
  }

  async findRoomById(id: RoomId): Promise<Room | null> {
    const row = await this.db
      .prepare("SELECT * FROM rooms WHERE room_id = ?")
      .bind(id)
      .first<RoomRow>();

    return row ? mapRowToRoom(row) : null;
  }

  async findEquipmentById(id: EquipmentId): Promise<Equipment | null> {
    const row = await this.db
      .prepare("SELECT * FROM equipment WHERE equipment_id = ?")
      .bind(id)
      .first<EquipmentRow>();

    return row ? mapRowToEquipment(row) : null;
  }

  private buildSaveStatements(studio: Studio): D1PreparedStatement[] {
    const upsertStudio = this.buildStudioUpsert(studio);
    const roomStatements = studio.rooms.map((room) => this.buildRoomUpsert(room, studio.studioId));
    return [upsertStudio, ...roomStatements];
  }

  private buildStudioUpsert(studio: Studio): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO studios (studio_id, name, prefecture, city, street, zip_code)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(studio_id) DO UPDATE SET
           name = ?2, prefecture = ?3, city = ?4, street = ?5, zip_code = ?6`,
      )
      .bind(
        studio.studioId,
        studio.name,
        studio.address.prefecture,
        studio.address.city,
        studio.address.street,
        studio.address.zipCode,
      );
  }

  private buildRoomUpsert(room: Room, studioId: StudioId): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO rooms (room_id, studio_id, name, capacity, hourly_rate)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(room_id) DO UPDATE SET
           studio_id = ?2, name = ?3, capacity = ?4, hourly_rate = ?5`,
      )
      .bind(room.roomId, studioId, room.name, room.capacity, room.hourlyRate.amount);
  }
}

export { D1StudioRepository };
