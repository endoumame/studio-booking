import type { CreateMemberCardProps, MemberCard } from "./member-card.js";
import { conflict, validation } from "../shared/errors.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../shared/errors.js";
import type { Email } from "../shared/email.js";
import type { MemberId } from "@my-app/shared";
import type { Result } from "neverthrow";
import { createMemberCard } from "./member-card.js";

const MIN_NAME_LENGTH = 0;

interface Member {
  readonly memberId: MemberId;
  readonly name: string;
  readonly email: Email;
  readonly card: MemberCard | null;
}

interface CreateMemberProps {
  readonly memberId: MemberId;
  readonly name: string;
  readonly email: Email;
}

const createMember = (props: CreateMemberProps): Result<Member, DomainError> => {
  if (props.name.trim().length === MIN_NAME_LENGTH) {
    return err(validation("Member name must not be empty"));
  }
  return ok({
    card: null,
    email: props.email,
    memberId: props.memberId,
    name: props.name.trim(),
  });
};

const issueCard = (
  member: Member,
  cardProps: CreateMemberCardProps,
): Result<Member, DomainError> => {
  if (member.card !== null) {
    return err(conflict("Member already has a card"));
  }
  return createMemberCard(cardProps).map((card) => ({
    ...member,
    card,
  }));
};

export { createMember, issueCard };
export type { CreateMemberProps, Member };
