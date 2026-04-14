import { toCardId, toMemberId } from "../brand-helpers.js";
import { Email } from "../../domain/shared/email.js";
import { Member } from "../../domain/member/member.js";
import type { MemberId } from "@my-app/shared";
import type { MemberRepository } from "../../domain/member/member-repository.js";
import { Point } from "../../domain/shared/point.js";

interface MemberRow {
  readonly member_id: string;
  readonly name: string;
  readonly email: string;
}

interface MemberCardRow {
  readonly card_id: string;
  readonly member_id: string;
  readonly card_number: string;
  readonly points: number;
  readonly issued_at: string;
}

const attachCard = (member: Member, cardRow: MemberCardRow): void => {
  const card = member.issueCard(
    toCardId(cardRow.card_id),
    cardRow.card_number,
    new Date(cardRow.issued_at),
  );
  const points = Point.create(cardRow.points);
  card.earnPoints(points);
};

const mapRowToMember = (row: MemberRow, cardRow: MemberCardRow | null): Member => {
  const member = Member.create(toMemberId(row.member_id), row.name, Email.create(row.email));

  if (cardRow) {
    attachCard(member, cardRow);
  }

  return member;
};

class D1MemberRepository implements MemberRepository {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async save(member: Member): Promise<void> {
    const statements = this.buildSaveStatements(member);
    await this.db.batch(statements);
  }

  async findById(id: MemberId): Promise<Member | null> {
    const memberRow = await this.db
      .prepare("SELECT * FROM members WHERE member_id = ?")
      .bind(id)
      .first<MemberRow>();

    if (!memberRow) {
      return null;
    }

    const cardRow = await this.loadCard(id);
    return mapRowToMember(memberRow, cardRow);
  }

  async findByEmail(email: Email): Promise<Member | null> {
    const memberRow = await this.db
      .prepare("SELECT * FROM members WHERE email = ?")
      .bind(email.value)
      .first<MemberRow>();

    if (!memberRow) {
      return null;
    }

    const cardRow = await this.loadCard(toMemberId(memberRow.member_id));
    return mapRowToMember(memberRow, cardRow);
  }

  private async loadCard(memberId: MemberId): Promise<MemberCardRow | null> {
    const result = await this.db
      .prepare("SELECT * FROM member_cards WHERE member_id = ?")
      .bind(memberId)
      .first<MemberCardRow>();
    return result;
  }

  private buildSaveStatements(member: Member): D1PreparedStatement[] {
    const memberUpsert = this.buildMemberUpsert(member);
    const statements: D1PreparedStatement[] = [memberUpsert];

    if (member.card) {
      statements.push(this.buildCardUpsert(member));
    }

    return statements;
  }

  private buildMemberUpsert(member: Member): D1PreparedStatement {
    return this.db
      .prepare(
        `INSERT INTO members (member_id, name, email)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(member_id) DO UPDATE SET name = ?2, email = ?3`,
      )
      .bind(member.memberId, member.name, member.email.value);
  }

  private buildCardUpsert(member: Member): D1PreparedStatement {
    const { card } = member;
    if (!card) {
      throw new Error("Cannot build card upsert without a member card");
    }
    return this.db
      .prepare(
        `INSERT INTO member_cards (card_id, member_id, card_number, points, issued_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(card_id) DO UPDATE SET
           card_number = ?3, points = ?4, issued_at = ?5`,
      )
      .bind(
        card.cardId,
        member.memberId,
        card.cardNumber,
        card.points.value,
        card.issuedAt.toISOString(),
      );
  }
}

export { D1MemberRepository };
