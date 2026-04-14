import { approveExtension, checkIn } from "../../application/commands/index.js";
import type { AppContext } from "./error-handler.js";
import { D1BookingRepository } from "../../infrastructure/repositories/d1-booking-repository.js";
import { D1MemberRepository } from "../../infrastructure/repositories/d1-member-repository.js";
import { D1StudioRepository } from "../../infrastructure/repositories/d1-studio-repository.js";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import { getRoomStatus } from "../../application/queries/index.js";
import { handleError } from "./error-handler.js";
import { toBookingId } from "../../infrastructure/brand-helpers.js";

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

const handleCheckIn = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("bookingId") ?? "";
    const bookingRepo = new D1BookingRepository(ctx.env.DB);
    const memberRepo = new D1MemberRepository(ctx.env.DB);
    const result = await checkIn(
      { bookingId: toBookingId(bookingId) },
      { bookingRepo, memberRepo },
    );
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleApproveExtension = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("bookingId") ?? "";
    const bookingRepo = new D1BookingRepository(ctx.env.DB);
    const studioRepo = new D1StudioRepository(ctx.env.DB);
    const result = await approveExtension(
      { bookingId: toBookingId(bookingId) },
      { bookingRepo, studioRepo },
    );
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleRejectExtension = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("bookingId") ?? "";
    const bookingRepo = new D1BookingRepository(ctx.env.DB);
    const booking = await bookingRepo.findById(toBookingId(bookingId));
    if (booking === null) {
      return ctx.json({ error: "Booking not found" }, HTTP_NOT_FOUND);
    }
    const rejected = booking.rejectExtension();
    await bookingRepo.save(rejected, []);
    return ctx.json({ bookingId: rejected.bookingId, status: rejected.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleGetRoomStatus = async (ctx: AppContext): Promise<Response> => {
  try {
    const studioId = ctx.req.query("studioId") ?? "";
    const date = ctx.req.query("date") ?? "";
    const result = await getRoomStatus({ date, studioId }, ctx.env.DB);
    return ctx.json(result, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const staffRouter = new Hono<{ Bindings: Env }>();

staffRouter.post("/checkin/:bookingId", handleCheckIn);
staffRouter.post("/extension/:bookingId/approve", handleApproveExtension);
staffRouter.post("/extension/:bookingId/reject", handleRejectExtension);
staffRouter.get("/rooms/status", handleGetRoomStatus);

export { staffRouter };
