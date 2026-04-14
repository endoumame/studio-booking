import type { AddRoomBody, CreateStudioBody } from "./admin-factory.js";
import { buildRoom, buildStudio } from "./admin-factory.js";
import { toBookingId, toStudioId } from "../../infrastructure/brand-helpers.js";
import type { AppContext } from "./error-handler.js";
import { D1BookingRepository } from "../../infrastructure/repositories/d1-booking-repository.js";
import { D1StudioRepository } from "../../infrastructure/repositories/d1-studio-repository.js";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import { completeBooking } from "../../application/commands/index.js";
import { handleError } from "./error-handler.js";
import { listStudios } from "../../application/queries/index.js";

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;

const handleListStudios = async (ctx: AppContext): Promise<Response> => {
  try {
    const result = await listStudios(ctx.env.DB);
    return ctx.json(result, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleCreateStudio = async (ctx: AppContext): Promise<Response> => {
  try {
    const body = await ctx.req.json<CreateStudioBody>();
    const studio = buildStudio(body);
    const studioRepo = new D1StudioRepository(ctx.env.DB);
    await studioRepo.save(studio);
    return ctx.json({ studioId: studio.studioId }, HTTP_CREATED);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const addRoomToStudio = async (ctx: AppContext): Promise<Response> => {
  const studioId = ctx.req.param("studioId") ?? "";
  const body = await ctx.req.json<AddRoomBody>();
  const studioRepo = new D1StudioRepository(ctx.env.DB);
  const studio = await studioRepo.findById(toStudioId(studioId));
  if (studio === null) {
    return ctx.json({ error: "Studio not found" }, HTTP_NOT_FOUND);
  }
  const room = buildRoom(body);
  studio.addRoom(room);
  await studioRepo.save(studio);
  return ctx.json({ roomId: room.roomId }, HTTP_CREATED);
};

const handleAddRoom = async (ctx: AppContext): Promise<Response> => {
  try {
    return await addRoomToStudio(ctx);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleCompleteBooking = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("bookingId") ?? "";
    const deps = { bookingRepo: new D1BookingRepository(ctx.env.DB) };
    const result = await completeBooking({ bookingId: toBookingId(bookingId) }, deps);
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.get("/studios", handleListStudios);
adminRouter.post("/studios", handleCreateStudio);
adminRouter.post("/studios/:studioId/rooms", handleAddRoom);
adminRouter.post("/bookings/:bookingId/complete", handleCompleteBooking);

export { adminRouter };
