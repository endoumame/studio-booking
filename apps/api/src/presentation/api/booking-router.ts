import type {
  CancelBookingDeps,
  CreateBookingDeps,
  CreateBookingInput,
} from "../../application/commands/index.js";
import {
  cancelBookingCommand,
  createBookingCommand,
  requestExtensionCommand,
} from "../../application/commands/index.js";
import {
  createD1BookingRepository,
  createD1StudioRepository,
  toBandId,
  toBookingId,
  toMemberId,
  toRoomId,
} from "../../infrastructure/index.js";
import {
  getBookingDetailQuery,
  getBookingHistoryQuery,
  searchAvailableSlotsQuery,
} from "../../application/queries/index.js";
import type { Context } from "hono";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import type { PaymentMethodType } from "@my-app/shared";
import { handleResult } from "./result-handler.js";

interface CreateBookingBody {
  readonly memberId: string;
  readonly roomId: string;
  readonly bandId: string | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly paymentMethod: PaymentMethodType;
  readonly pointsToUse: number;
}

interface ExtensionBody {
  readonly extraMinutes: number;
}

const buildBookingDeps = (db: D1Database): CreateBookingDeps => ({
  bookingRepo: createD1BookingRepository(db),
  studioRepo: createD1StudioRepository(db),
});

const buildBookingOnlyDeps = (db: D1Database): CancelBookingDeps => ({
  bookingRepo: createD1BookingRepository(db),
});

const parseCreateBody = (body: CreateBookingBody): CreateBookingInput => ({
  bandId: body.bandId === null ? null : toBandId(body.bandId),
  endTime: new Date(body.endTime),
  memberId: toMemberId(body.memberId),
  paymentMethod: body.paymentMethod,
  pointsToUse: body.pointsToUse,
  roomId: toRoomId(body.roomId),
  startTime: new Date(body.startTime),
});

const handleSearchSlots = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const db = ctx.env.DB;
  const roomId = toRoomId(ctx.req.query("roomId") ?? "");
  const date = ctx.req.query("date") ?? "";
  const result = await searchAvailableSlotsQuery(db, { date, roomId });
  return handleResult(ctx, result);
};

const handleGetHistory = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const db = ctx.env.DB;
  const memberId = toMemberId(ctx.req.query("memberId") ?? "");
  const result = await getBookingHistoryQuery(db, { memberId });
  return handleResult(ctx, result);
};

const handleGetDetail = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const db = ctx.env.DB;
  const bookingId = toBookingId(ctx.req.param("id") ?? "");
  const result = await getBookingDetailQuery(db, { bookingId });
  return handleResult(ctx, result);
};

const handleCreate = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as CreateBookingBody;
  const db = ctx.env.DB;
  const deps = buildBookingDeps(db);
  const input = parseCreateBody(body);
  const result = await createBookingCommand(input, deps);
  return handleResult(ctx, result);
};

const handleCancel = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const db = ctx.env.DB;
  const bookingId = toBookingId(ctx.req.param("id") ?? "");
  const deps = buildBookingOnlyDeps(db);
  const result = await cancelBookingCommand({ bookingId }, deps);
  return handleResult(ctx, result);
};

const handleRequestExtension = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as ExtensionBody;
  const db = ctx.env.DB;
  const bookingId = toBookingId(ctx.req.param("id") ?? "");
  const deps = buildBookingOnlyDeps(db);
  const input = { bookingId, extraMinutes: body.extraMinutes };
  const result = await requestExtensionCommand(input, deps);
  return handleResult(ctx, result);
};

const bookingRouter = new Hono<{ Bindings: Env }>();

bookingRouter.get("/search", handleSearchSlots);
bookingRouter.get("/", handleGetHistory);
bookingRouter.get("/:id", handleGetDetail);
bookingRouter.post("/", handleCreate);
bookingRouter.delete("/:id", handleCancel);
bookingRouter.post("/:id/extension", handleRequestExtension);

export { bookingRouter };
