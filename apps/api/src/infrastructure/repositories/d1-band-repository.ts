import type { BandId, MemberId } from "@my-app/shared";
import { toBandId, toMemberId } from "../brand-helpers.js";
import { Band } from "../../domain/band/band.js";
import type { BandRepository } from "../../domain/band/band-repository.js";

interface BandRow {
  readonly band_id: string;
  readonly name: string;
}

interface BandMemberRow {
  readonly band_id: string;
  readonly member_id: string;
}

const mapRowToBand = (bandRow: BandRow, memberRows: BandMemberRow[]): Band => {
  let band = Band.create(toBandId(bandRow.band_id), bandRow.name);
  for (const row of memberRows) {
    band = band.addMember(toMemberId(row.member_id));
  }
  return band;
};

class D1BandRepository implements BandRepository {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async save(band: Band): Promise<void> {
    const statements = this.buildSaveStatements(band);
    await this.db.batch(statements);
  }

  async findById(id: BandId): Promise<Band | null> {
    const bandRow = await this.db
      .prepare("SELECT * FROM bands WHERE band_id = ?")
      .bind(id)
      .first<BandRow>();

    if (!bandRow) {
      return null;
    }

    const memberResult = await this.db
      .prepare("SELECT * FROM band_members WHERE band_id = ?")
      .bind(id)
      .all<BandMemberRow>();

    return mapRowToBand(bandRow, memberResult.results);
  }

  private buildSaveStatements(band: Band): D1PreparedStatement[] {
    const bandUpsert = this.buildBandUpsert(band);
    const deleteMembers = this.buildDeleteMembers(band.bandId);
    const memberInserts = band.members.map((memberId) =>
      this.buildMemberInsert(band.bandId, memberId),
    );
    return [bandUpsert, deleteMembers, ...memberInserts];
  }

  private buildBandUpsert(band: Band): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO bands (band_id, name)
         VALUES (?1, ?2)
         ON CONFLICT(band_id) DO UPDATE SET name = ?2`,
      )
      .bind(band.bandId, band.name);
  }

  private buildDeleteMembers(bandId: BandId): D1PreparedStatement {
    return this.db.prepare("DELETE FROM band_members WHERE band_id = ?").bind(bandId);
  }

  private buildMemberInsert(bandId: BandId, memberId: MemberId): D1PreparedStatement {
    return this.db
      .prepare("INSERT INTO band_members (band_id, member_id) VALUES (?, ?)")
      .bind(bandId, memberId);
  }
}

export { D1BandRepository };
