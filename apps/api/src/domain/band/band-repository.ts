import type { Band } from "./band.js";
import type { BandId } from "@my-app/shared";
import type { DomainError } from "../shared/errors.js";
import type { Result } from "neverthrow";

interface BandRepository {
  readonly findById: (id: BandId) => Promise<Result<Band | null, DomainError>>;
  readonly save: (band: Band) => Promise<Result<null, DomainError>>;
}

export type { BandRepository };
