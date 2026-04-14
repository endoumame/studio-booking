import type { Env } from "./env.js";
import { Hono } from "hono";
import { adminRouter } from "./presentation/api/admin-router.js";
import { bookingRouter } from "./presentation/api/booking-router.js";
import { staffRouter } from "./presentation/api/staff-router.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (ctx) => ctx.json({ status: "ok" }));
app.route("/api/bookings", bookingRouter);
app.route("/api/staff", staffRouter);
app.route("/api/admin", adminRouter);

export type AppType = typeof app;
export default app;
