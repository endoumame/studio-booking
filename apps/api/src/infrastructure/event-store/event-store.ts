import type { EventId } from "@my-app/shared";
import { toEventId } from "../brand-helpers.js";

interface StoredEvent {
  readonly id: EventId;
  readonly streamId: string;
  readonly streamType: string;
  readonly eventType: string;
  readonly payload: string;
  readonly version: number;
  readonly occurredAt: string;
}

interface EventRow {
  readonly id: string;
  readonly stream_id: string;
  readonly stream_type: string;
  readonly event_type: string;
  readonly payload: string;
  readonly version: number;
  readonly occurred_at: string;
}

interface AppendParams {
  streamId: string;
  streamType: string;
  events: StoredEvent[];
  expectedVersion: number;
}

const FIRST_VERSION = 1;

const toStoredEvent = (row: EventRow): StoredEvent => ({
  eventType: row.event_type,
  id: toEventId(row.id),
  occurredAt: row.occurred_at,
  payload: row.payload,
  streamId: row.stream_id,
  streamType: row.stream_type,
  version: row.version,
});

const buildInsertStatement = (db: D1Database, event: StoredEvent): D1PreparedStatement =>
  db
    .prepare(
      "INSERT INTO events (id, stream_id, stream_type, event_type, payload, version, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      event.id,
      event.streamId,
      event.streamType,
      event.eventType,
      event.payload,
      event.version,
      event.occurredAt,
    );

const validateExpectedVersion = (actualVersion: number, expectedVersion: number): void => {
  if (actualVersion !== expectedVersion) {
    throw new Error(
      `Optimistic concurrency conflict: expected version ${String(expectedVersion)}, but stream is at version ${String(actualVersion)}`,
    );
  }
};

class EventStore {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async append(params: AppendParams): Promise<void> {
    const currentVersion = await this.getCurrentVersion(params.streamId);
    validateExpectedVersion(currentVersion, params.expectedVersion);
    const statements = params.events.map((event) => buildInsertStatement(this.db, event));
    await this.db.batch(statements);
  }

  async loadStream(streamId: string): Promise<StoredEvent[]> {
    const result = await this.db
      .prepare("SELECT * FROM events WHERE stream_id = ? ORDER BY version ASC")
      .bind(streamId)
      .all<EventRow>();

    return result.results.map(toStoredEvent);
  }

  private async getCurrentVersion(streamId: string): Promise<number> {
    const result = await this.db
      .prepare("SELECT MAX(version) as max_version FROM events WHERE stream_id = ?")
      .bind(streamId)
      .first<{ max_version: number | null }>();

    const NO_EVENTS_VERSION = 0;
    return result?.max_version ?? NO_EVENTS_VERSION;
  }
}

export { EventStore, FIRST_VERSION };
export type { AppendParams, EventRow, StoredEvent };
