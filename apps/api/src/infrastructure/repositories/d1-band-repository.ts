import { err, ok } from "neverthrow";
import { toBandId, toMemberId } from "../brand-helpers.js";
import type { Band } from "../../domain/band/band.js";
import type { BandRepository } from "../../domain/band/band-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Result } from "neverthrow";
import { conflict } from "../../domain/shared/errors.js";

interface BandRow {
  readonly band_id: string;
  readonly name: string;
}

interface BandMemberRow {
  readonly band_id: string;
  readonly member_id: string;
}

const FIND_BAND_SQL = "SELECT * FROM bands WHERE band_id = ?";
const FIND_BAND_MEMBERS_SQL = "SELECT * FROM band_members WHERE band_id = ?";

interface MapBandParams {
  readonly bandRow: BandRow;
  readonly memberRows: readonly BandMemberRow[];
}

const mapToBand = (params: MapBandParams): Band => ({
  bandId: toBandId(params.bandRow.band_id),
  members: params.memberRows.map((row) => toMemberId(row.member_id)),
  name: params.bandRow.name,
});

const findBandById = async (
  db: D1Database,
  id: string,
): Promise<Result<Band | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_BAND_SQL).bind(id).first<BandRow>();
    if (row === null) {
      return ok(null);
    }
    const memberResult = await db.prepare(FIND_BAND_MEMBERS_SQL).bind(id).all<BandMemberRow>();
    return ok(mapToBand({ bandRow: row, memberRows: memberResult.results }));
  } catch {
    return err(conflict("Failed to find band"));
  }
};

const UPSERT_BAND_SQL = `INSERT INTO bands (band_id, name)
VALUES (?, ?)
ON CONFLICT(band_id) DO UPDATE SET name=?`;

const DELETE_BAND_MEMBERS_SQL = "DELETE FROM band_members WHERE band_id = ?";

const INSERT_BAND_MEMBER_SQL = "INSERT INTO band_members (band_id, member_id) VALUES (?, ?)";

const buildMemberStmts = (db: D1Database, band: Band): D1PreparedStatement[] =>
  band.members.map((memberId) => db.prepare(INSERT_BAND_MEMBER_SQL).bind(band.bandId, memberId));

const saveBand = async (db: D1Database, band: Band): Promise<Result<null, DomainError>> => {
  try {
    const bandStmt = db.prepare(UPSERT_BAND_SQL).bind(band.bandId, band.name, band.name);
    const deleteStmt = db.prepare(DELETE_BAND_MEMBERS_SQL).bind(band.bandId);
    const memberStmts = buildMemberStmts(db, band);
    await db.batch([bandStmt, deleteStmt, ...memberStmts]);
    // oxlint-disable-next-line typescript-eslint/no-invalid-void-type, typescript-eslint/no-unsafe-type-assertion
    return ok(null);
  } catch {
    return err(conflict("Failed to save band"));
  }
};

const createD1BandRepository = (db: D1Database): BandRepository => ({
  findById: async (id): Promise<Result<Band | null, DomainError>> => {
    const result = await findBandById(db, id);
    return result;
  },
  save: async (band): Promise<Result<null, DomainError>> => {
    const result = await saveBand(db, band);
    return result;
  },
});

export { createD1BandRepository };
