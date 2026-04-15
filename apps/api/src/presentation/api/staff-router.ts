import type { ApproveExtensionDeps, CheckInDeps } from "../../application/commands/index.js";
import { approveExtensionCommand, checkInCommand } from "../../application/commands/index.js";
import {
  createD1BookingRepository,
  createD1MemberRepository,
  createD1StudioRepository,
  toBookingId,
  toMemberId,
  toRoomId,
  toStudioId,
} from "../../infrastructure/index.js";
import { err, ok } from "neverthrow";
import type { Booking } from "../../domain/booking/index.js";
import type { Context } from "hono";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import type { Result } from "neverthrow";
import { getRoomStatusQuery } from "../../application/queries/index.js";
import { handleResult } from "./result-handler.js";
import { notFound } from "../../domain/shared/errors.js";
import { rejectBookingExtension } from "../../domain/booking/index.js";

interface CheckInBody {
  readonly memberId: string;
}

interface ApproveExtensionBody {
  readonly roomId: string;
}

const buildCheckInDeps = (db: D1Database): CheckInDeps => ({
  bookingRepo: createD1BookingRepository(db),
  memberRepo: createD1MemberRepository(db),
});

const buildApprovalDeps = (db: D1Database): ApproveExtensionDeps => ({
  bookingRepo: createD1BookingRepository(db),
  studioRepo: createD1StudioRepository(db),
});

const handleCheckIn = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as CheckInBody;
  const db = ctx.env.DB;
  const bookingId = toBookingId(ctx.req.param("bookingId") ?? "");
  const memberId = toMemberId(body.memberId);
  const deps = buildCheckInDeps(db);
  const result = await checkInCommand({ bookingId, memberId }, deps);
  return handleResult(ctx, result);
};

const handleApproveExtension = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const body = (await ctx.req.json()) as ApproveExtensionBody;
  const db = ctx.env.DB;
  const bookingId = toBookingId(ctx.req.param("bookingId") ?? "");
  const roomId = toRoomId(body.roomId);
  const deps = buildApprovalDeps(db);
  const result = await approveExtensionCommand({ bookingId, roomId }, deps);
  return handleResult(ctx, result);
};

const resolveBooking = (
  loaded: Result<Booking | null, DomainError>,
): Result<Booking, DomainError> =>
  loaded.andThen((booking) => {
    if (booking === null) {
      return err(notFound("Booking not found"));
    }
    return ok(booking);
  });

const rejectAndSave = async (
  ctx: Context<{ Bindings: Env }>,
  booking: Booking,
): Promise<Response> => {
  const rejected = rejectBookingExtension(booking);
  if (rejected.isErr()) {
    return handleResult(ctx, rejected);
  }
  const bookingRepo = createD1BookingRepository(ctx.env.DB);
  const saved = await bookingRepo.save(rejected.value, []);
  return handleResult(
    ctx,
    saved.map(() => rejected.value),
  );
};

const handleRejectExtension = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const bookingRepo = createD1BookingRepository(ctx.env.DB);
  const bookingId = toBookingId(ctx.req.param("bookingId") ?? "");
  const loaded = await bookingRepo.findById(bookingId);
  const bookingResult = resolveBooking(loaded);
  if (bookingResult.isErr()) {
    return handleResult(ctx, bookingResult);
  }
  return rejectAndSave(ctx, bookingResult.value);
};

const handleGetRoomStatus = async (ctx: Context<{ Bindings: Env }>): Promise<Response> => {
  const db = ctx.env.DB;
  const studioId = toStudioId(ctx.req.query("studioId") ?? "");
  const date = ctx.req.query("date") ?? "";
  const result = await getRoomStatusQuery(db, { date, studioId });
  return handleResult(ctx, result);
};

const staffRouter = new Hono<{ Bindings: Env }>();

staffRouter.post("/checkin/:bookingId", handleCheckIn);
staffRouter.post("/extension/:bookingId/approve", handleApproveExtension);
staffRouter.post("/extension/:bookingId/reject", handleRejectExtension);
staffRouter.get("/rooms/status", handleGetRoomStatus);

export { staffRouter };
