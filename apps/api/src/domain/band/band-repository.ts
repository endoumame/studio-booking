import type { Band } from "./band.js";
import type { BandId } from "@my-app/shared";

interface BandRepository {
  save(band: Band): Promise<void>;
  findById(id: BandId): Promise<Band | null>;
}

export type { BandRepository };
