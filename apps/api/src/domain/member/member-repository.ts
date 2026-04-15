import type { DomainError } from "../shared/errors.js";
import type { DomainEvent } from "../shared/events/domain-event.js";
import type { Member } from "./member.js";
import type { MemberId } from "@my-app/shared";
import type { Result } from "neverthrow";

interface MemberRepository {
  readonly findById: (memberId: MemberId) => Promise<Result<Member | null, DomainError>>;
  readonly save: (
    member: Member,
    events: readonly DomainEvent[],
  ) => Promise<Result<null, DomainError>>;
}

export type { MemberRepository };
