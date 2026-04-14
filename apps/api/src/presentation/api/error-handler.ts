import type { Context } from "hono";
import type { Env } from "../../env.js";

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

type AppContext = Context<{ Bindings: Env }>;

const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("not found");

const handleError = (ctx: AppContext, error: unknown): Response => {
  if (isNotFoundError(error)) {
    const message = error instanceof Error ? error.message : "Not found";
    return ctx.json({ error: message }, HTTP_NOT_FOUND);
  }
  if (error instanceof Error) {
    return ctx.json({ error: error.message }, HTTP_BAD_REQUEST);
  }
  return ctx.json({ error: "Internal server error" }, HTTP_INTERNAL_SERVER_ERROR);
};

export type { AppContext };
export { handleError };
