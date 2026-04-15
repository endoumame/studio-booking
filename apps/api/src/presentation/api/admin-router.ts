import {
  createD1BookingRepository,
  createD1StudioRepository,
  toBookingId,
  toPolicyId,
  toRoomId,
  toStudioId,
} from "../../infrastructure/index.js";
import { err, ok } from "neverthrow";
import type { Context } from "hono";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import type { Result } from "neverthrow";
import type { Room } from "../../domain/studio/room.js";
import type { Studio } from "../../domain/studio/studio.js";
import { completeBookingCommand } from "../../application/commands/index.js";
import { createRoom } from "../../domain/studio/room.js";
import { createStudio } from "../../domain/studio/studio.js";
import { handleResult } from "./result-handler.js";
import { listStudiosQuery } from "../../application/queries/index.js";
import { notFound } from "../../domain/shared/errors.js";

type AppContext = Context<{ Bindings: Env }>;

const CURRENCY = "JPY" as const;

interface CreateStudioBody {
  readonly name: string;
  readonly prefecture: string;
  readonly city: string;
  readonly street: string;
  readonly zipCode: string;
  readonly policyId: string;
  readonly rooms: readonly CreateRoomBody[];
}

interface CreateRoomBody {
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

interface AddRoomBody {
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRate: number;
}

const handleListStudios = async (ctx: AppContext): Promise<Response> => {
  const result = await listStudiosQuery(ctx.env.DB);
  return handleResult(ctx, result);
};

const buildRoomsFromBody = (rooms: readonly CreateRoomBody[]): readonly Room[] =>
  rooms.map((room) => ({
    capacity: room.capacity,
    equipment: [],
    hourlyRate: { amount: room.hourlyRate, currency: CURRENCY },
    name: room.name,
    roomId: toRoomId(crypto.randomUUID()),
  }));

const handleCreateStudio = async (ctx: AppContext): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as CreateStudioBody;
  const db = ctx.env.DB;
  const studioRepo = createD1StudioRepository(db);
  const rooms = buildRoomsFromBody(body.rooms);
  const studioResult = createStudio({
    address: {
      city: body.city,
      prefecture: body.prefecture,
      street: body.street,
      zipCode: body.zipCode,
    },
    cancellationPolicy: { policyId: toPolicyId(body.policyId), rules: [] },
    name: body.name,
    rooms,
    studioId: toStudioId(crypto.randomUUID()),
  });
  if (studioResult.isErr()) {
    return handleResult(ctx, studioResult);
  }
  const saved = await studioRepo.save(studioResult.value);
  return handleResult(
    ctx,
    saved.map(() => studioResult.value),
  );
};

const loadStudioForUpdate = async (
  db: D1Database,
  studioId: string,
): Promise<Result<Studio, DomainError>> => {
  const studioRepo = createD1StudioRepository(db);
  const loaded = await studioRepo.findById(toStudioId(studioId));
  return loaded.andThen((studio) => {
    if (studio === null) {
      return err(notFound("Studio not found"));
    }
    return ok(studio);
  });
};

const buildRoomFromAddBody = (body: AddRoomBody): Result<Room, DomainError> =>
  createRoom({
    capacity: body.capacity,
    equipment: [],
    hourlyRate: { amount: body.hourlyRate, currency: CURRENCY },
    name: body.name,
    roomId: toRoomId(crypto.randomUUID()),
  });

const saveStudioWithRoom = async (
  db: D1Database,
  studio: Studio,
  roomResult: Result<Room, DomainError>,
): Promise<Result<Studio, DomainError>> => {
  if (roomResult.isErr()) {
    return err(roomResult.error);
  }
  const updated = { ...studio, rooms: [...studio.rooms, roomResult.value] };
  const saved = await createD1StudioRepository(db).save(updated);
  return saved.map(() => updated);
};

const handleAddRoom = async (ctx: AppContext): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as AddRoomBody;
  const db = ctx.env.DB;
  const studioId = ctx.req.param("studioId") ?? "";
  const studioResult = await loadStudioForUpdate(db, studioId);
  if (studioResult.isErr()) {
    return handleResult(ctx, studioResult);
  }
  const result = await saveStudioWithRoom(db, studioResult.value, buildRoomFromAddBody(body));
  return handleResult(ctx, result);
};

const handleCompleteBooking = async (ctx: AppContext): Promise<Response> => {
  const bookingId = ctx.req.param("bookingId") ?? "";
  const bookingRepo = createD1BookingRepository(ctx.env.DB);
  const result = await completeBookingCommand(
    { bookingId: toBookingId(bookingId) },
    { bookingRepo },
  );
  return handleResult(ctx, result);
};

const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.get("/studios", handleListStudios);
adminRouter.post("/studios", handleCreateStudio);
adminRouter.post("/studios/:studioId/rooms", handleAddRoom);
adminRouter.post("/bookings/:bookingId/complete", handleCompleteBooking);

export { adminRouter };
