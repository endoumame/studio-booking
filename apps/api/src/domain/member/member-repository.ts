import type { Email } from "../shared/email.js";
import type { Member } from "./member.js";
import type { MemberId } from "@my-app/shared";

interface MemberRepository {
  save(member: Member): Promise<void>;
  findById(id: MemberId): Promise<Member | null>;
  findByEmail(email: Email): Promise<Member | null>;
}

export type { MemberRepository };
