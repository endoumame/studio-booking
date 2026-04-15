import { err, ok } from "neverthrow";
import { toCardId, toMemberId } from "../brand-helpers.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { Member } from "../../domain/member/member.js";
import type { MemberCard } from "../../domain/member/member-card.js";
import type { MemberRepository } from "../../domain/member/member-repository.js";
import type { Result } from "neverthrow";
import { conflict } from "../../domain/shared/errors.js";

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

const mapCardRow = (row: MemberCardRow | null): MemberCard | null =>
  row === null
    ? null
    : {
        cardId: toCardId(row.card_id),
        cardNumber: row.card_number,
        issuedAt: new Date(row.issued_at),
        points: { value: row.points },
      };

const FIND_MEMBER_SQL = "SELECT * FROM members WHERE member_id = ?";
const FIND_CARD_SQL = "SELECT * FROM member_cards WHERE member_id = ?";

interface MapMemberParams {
  readonly memberRow: MemberRow;
  readonly cardRow: MemberCardRow | null;
}

const mapToMember = (params: MapMemberParams): Member => ({
  card: mapCardRow(params.cardRow),
  email: { value: params.memberRow.email },
  memberId: toMemberId(params.memberRow.member_id),
  name: params.memberRow.name,
});

const findMemberById = async (
  db: D1Database,
  id: string,
): Promise<Result<Member | null, DomainError>> => {
  try {
    const row = await db.prepare(FIND_MEMBER_SQL).bind(id).first<MemberRow>();
    if (row === null) {
      return ok(null);
    }
    const cardRow = await db.prepare(FIND_CARD_SQL).bind(id).first<MemberCardRow>();
    return ok(mapToMember({ cardRow, memberRow: row }));
  } catch {
    return err(conflict("Failed to find member"));
  }
};

const UPSERT_MEMBER_SQL = `INSERT INTO members (member_id, name, email)
VALUES (?, ?, ?)
ON CONFLICT(member_id) DO UPDATE SET name=?, email=?`;

const buildMemberBindings = (member: Member): readonly unknown[] => [
  member.memberId,
  member.name,
  member.email.value,
  member.name,
  member.email.value,
];

const UPSERT_CARD_SQL = `INSERT INTO member_cards (card_id, member_id, card_number, points, issued_at)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(card_id) DO UPDATE SET card_number=?, points=?, issued_at=?`;

const buildCardBindings = (member: Member): readonly unknown[] | null => {
  if (member.card === null) {
    return null;
  }
  const { card } = member;
  return [
    card.cardId,
    member.memberId,
    card.cardNumber,
    card.points.value,
    card.issuedAt.toISOString(),
    card.cardNumber,
    card.points.value,
    card.issuedAt.toISOString(),
  ];
};

const buildMemberStmts = (db: D1Database, member: Member): D1PreparedStatement[] => {
  const memberStmt = db.prepare(UPSERT_MEMBER_SQL).bind(...buildMemberBindings(member));
  const cardBindings = buildCardBindings(member);
  if (cardBindings === null) {
    return [memberStmt];
  }
  const cardStmt = db.prepare(UPSERT_CARD_SQL).bind(...cardBindings);
  return [memberStmt, cardStmt];
};

const saveMember = async (db: D1Database, member: Member): Promise<Result<null, DomainError>> => {
  try {
    const stmts = buildMemberStmts(db, member);
    await db.batch(stmts);
    // oxlint-disable-next-line typescript-eslint/no-invalid-void-type, typescript-eslint/no-unsafe-type-assertion
    return ok(null);
  } catch {
    return err(conflict("Failed to save member"));
  }
};

const createD1MemberRepository = (db: D1Database): MemberRepository => ({
  findById: async (id): Promise<Result<Member | null, DomainError>> => {
    const result = await findMemberById(db, id);
    return result;
  },
  save: async (member): Promise<Result<null, DomainError>> => {
    const result = await saveMember(db, member);
    return result;
  },
});

export { createD1MemberRepository };
