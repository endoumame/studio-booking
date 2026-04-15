import { err, ok } from "neverthrow";
import type { DomainError } from "../domain/shared/errors.js";
import type { DomainEvent } from "../domain/shared/events/domain-event.js";
import type { EventId } from "@my-app/shared";
import type { Result } from "neverthrow";
import { conflict } from "../domain/shared/errors.js";
import { toEventId } from "./brand-helpers.js";

interface StoredEvent {
  readonly id: EventId;
  readonly streamId: string;
  readonly streamType: string;
  readonly eventType: string;
  readonly payload: string;
  readonly version: number;
  readonly occurredAt: string;
}

interface AppendParams {
  readonly streamId: string;
  readonly streamType: string;
  readonly events: readonly DomainEvent[];
  readonly expectedVersion: number;
}

const VERSION_INCREMENT = 1;

const serializeEvent = (event: DomainEvent): string => JSON.stringify(event);

const buildStoredEvent = (
  event: DomainEvent,
  params: AppendParams,
  index: number,
): StoredEvent => ({
  eventType: event.type,
  id: event.eventId,
  occurredAt: event.occurredAt.toISOString(),
  payload: serializeEvent(event),
  streamId: params.streamId,
  streamType: params.streamType,
  version: params.expectedVersion + index + VERSION_INCREMENT,
});

const insertEventStmt = (db: D1Database, stored: StoredEvent): D1PreparedStatement =>
  db
    .prepare(
      "INSERT INTO events (id, stream_id, stream_type, event_type, payload, version, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      stored.id,
      stored.streamId,
      stored.streamType,
      stored.eventType,
      stored.payload,
      stored.version,
      stored.occurredAt,
    );

const appendEvents = async (
  db: D1Database,
  params: AppendParams,
): Promise<Result<null, DomainError>> => {
  const storedEvents = params.events.map((event, index) => buildStoredEvent(event, params, index));
  const stmts = storedEvents.map((stored) => insertEventStmt(db, stored));
  try {
    await db.batch(stmts);
    return ok(null);
  } catch {
    return err(conflict(`Event version conflict on stream: ${params.streamId}`));
  }
};

interface StoredEventRow {
  readonly id: string;
  readonly stream_id: string;
  readonly stream_type: string;
  readonly event_type: string;
  readonly payload: string;
  readonly version: number;
  readonly occurred_at: string;
}

const mapRowToStoredEvent = (row: StoredEventRow): StoredEvent => ({
  eventType: row.event_type,
  id: toEventId(row.id),
  occurredAt: row.occurred_at,
  payload: row.payload,
  streamId: row.stream_id,
  streamType: row.stream_type,
  version: row.version,
});

const loadStream = async (db: D1Database, streamId: string): Promise<readonly StoredEvent[]> => {
  const result = await db
    .prepare(
      "SELECT id, stream_id, stream_type, event_type, payload, version, occurred_at FROM events WHERE stream_id = ? ORDER BY version ASC",
    )
    .bind(streamId)
    .all<StoredEventRow>();
  return result.results.map(mapRowToStoredEvent);
};

export { appendEvents, loadStream };
export type { AppendParams, StoredEvent };
