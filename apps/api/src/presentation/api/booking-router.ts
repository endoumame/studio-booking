import {
  cancelBooking,
  createBooking,
  requestExtension,
} from "../../application/commands/index.js";
import {
  getBookingDetail,
  getBookingHistory,
  searchAvailableSlots,
} from "../../application/queries/index.js";
import {
  toBandIdOrNull,
  toBookingId,
  toMemberId,
  toRoomId,
} from "../../infrastructure/brand-helpers.js";
import type { AppContext } from "./error-handler.js";
import type { CreateBookingInput } from "../../application/commands/index.js";
import { D1BookingRepository } from "../../infrastructure/repositories/d1-booking-repository.js";
import { D1StudioRepository } from "../../infrastructure/repositories/d1-studio-repository.js";
import type { Env } from "../../env.js";
import { Hono } from "hono";
import type { PaymentMethod } from "@my-app/shared";
import type { SearchAvailableSlotsInput } from "../../application/queries/index.js";
import { handleError } from "./error-handler.js";

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;

interface CreateBookingBody {
  memberId: string;
  roomId: string;
  bandId: string | null;
  startTime: string;
  endTime: string;
  paymentMethod: string;
  pointsToUse: number;
}

interface RequestExtensionBody {
  extraMinutes: number;
}

const extractSearchParams = (ctx: AppContext): SearchAvailableSlotsInput => {
  const params: SearchAvailableSlotsInput = {
    date: ctx.req.query("date") ?? "",
    roomId: ctx.req.query("roomId"),
  };
  const startHourRaw = ctx.req.query("startHour");
  const endHourRaw = ctx.req.query("endHour");
  if (startHourRaw !== null && startHourRaw !== "") {
    return { ...params, endHour: params.endHour, startHour: Number(startHourRaw) };
  }
  if (endHourRaw !== null && endHourRaw !== "") {
    return { ...params, endHour: Number(endHourRaw), startHour: params.startHour };
  }
  return params;
};

const handleSearchAvailableSlots = async (ctx: AppContext): Promise<Response> => {
  try {
    const params = extractSearchParams(ctx);
    const result = await searchAvailableSlots(params, ctx.env.DB);
    return ctx.json(result, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleGetBookingHistory = async (ctx: AppContext): Promise<Response> => {
  try {
    const memberId = ctx.req.query("memberId") ?? "";
    const result = await getBookingHistory({ memberId }, ctx.env.DB);
    return ctx.json(result, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleGetBookingDetail = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("id") ?? "";
    const result = await getBookingDetail({ bookingId }, ctx.env.DB);
    if (result === null) {
      return ctx.json({ error: "Booking not found" }, HTTP_NOT_FOUND);
    }
    return ctx.json(result, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const buildCreateBookingInput = (body: CreateBookingBody): CreateBookingInput => ({
  bandId: toBandIdOrNull(body.bandId),
  endTime: new Date(body.endTime),
  memberId: toMemberId(body.memberId),
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  paymentMethod: body.paymentMethod as PaymentMethod,
  pointsToUse: body.pointsToUse,
  roomId: toRoomId(body.roomId),
  startTime: new Date(body.startTime),
});

const handleCreateBooking = async (ctx: AppContext): Promise<Response> => {
  try {
    const body = await ctx.req.json<CreateBookingBody>();
    const bookingRepo = new D1BookingRepository(ctx.env.DB);
    const studioRepo = new D1StudioRepository(ctx.env.DB);
    const result = await createBooking(buildCreateBookingInput(body), { bookingRepo, studioRepo });
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_CREATED);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleCancelBooking = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("id") ?? "";
    const deps = { bookingRepo: new D1BookingRepository(ctx.env.DB) };
    const result = await cancelBooking({ bookingId: toBookingId(bookingId) }, deps);
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const handleRequestExtension = async (ctx: AppContext): Promise<Response> => {
  try {
    const bookingId = ctx.req.param("id") ?? "";
    const body = await ctx.req.json<RequestExtensionBody>();
    const deps = { bookingRepo: new D1BookingRepository(ctx.env.DB) };
    const input = { bookingId: toBookingId(bookingId), extraMinutes: body.extraMinutes };
    const result = await requestExtension(input, deps);
    return ctx.json({ bookingId: result.bookingId, status: result.status }, HTTP_OK);
  } catch (error) {
    return handleError(ctx, error);
  }
};

const bookingRouter = new Hono<{ Bindings: Env }>();

bookingRouter.get("/search", handleSearchAvailableSlots);
bookingRouter.get("/:id", handleGetBookingDetail);
bookingRouter.get("/", handleGetBookingHistory);
bookingRouter.post("/", handleCreateBooking);
bookingRouter.delete("/:id", handleCancelBooking);
bookingRouter.post("/:id/extension", handleRequestExtension);

export { bookingRouter };
