import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Context } from "hono";
import type { DomainError } from "../../domain/shared/errors.js";
// oxlint-disable-next-line import/no-duplicates
import { DomainErrorTag } from "../../domain/shared/errors.js";
import type { Env } from "../../env.js";
import type { Result } from "neverthrow";

/* oxlint-disable no-magic-numbers */
const HTTP_OK = 200 as const;
const HTTP_BAD_REQUEST = 400 as const;
const HTTP_NOT_FOUND = 404 as const;
const HTTP_CONFLICT = 409 as const;
const HTTP_UNPROCESSABLE = 422 as const;
/* oxlint-enable no-magic-numbers */

const errorStatusMap: Record<string, ContentfulStatusCode> = {
  [DomainErrorTag.CONFLICT]: HTTP_CONFLICT,
  [DomainErrorTag.INVALID_STATE]: HTTP_UNPROCESSABLE,
  [DomainErrorTag.NOT_FOUND]: HTTP_NOT_FOUND,
  [DomainErrorTag.VALIDATION]: HTTP_BAD_REQUEST,
};

const mapErrorToResponse = (ctx: Context<{ Bindings: Env }>, error: DomainError): Response => {
  const status = errorStatusMap[error.tag] ?? HTTP_BAD_REQUEST;
  return ctx.json({ error: error.message, tag: error.tag }, status);
};

const handleResult = <TData>(
  ctx: Context<{ Bindings: Env }>,
  result: Result<TData, DomainError>,
): Response =>
  result.match(
    (data) => ctx.json(data, HTTP_OK),
    (error) => mapErrorToResponse(ctx, error),
  );

export { handleResult, HTTP_OK, mapErrorToResponse };
