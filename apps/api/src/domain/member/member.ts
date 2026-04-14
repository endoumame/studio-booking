import type { CardId, MemberId } from "@my-app/shared";

import type { Email } from "../shared/email.js";
import { MemberCard } from "./member-card.js";

const MIN_LENGTH = 0;

class Member {
  readonly memberId: MemberId;
  readonly name: string;
  readonly email: Email;
  private _card: MemberCard | null;

  private constructor(memberId: MemberId, name: string, email: Email) {
    this.memberId = memberId;
    this.name = name;
    this.email = email;
    this._card = null;
  }

  static create(memberId: MemberId, name: string, email: Email): Member {
    if (name.length === MIN_LENGTH) {
      throw new Error("Member name must not be empty");
    }
    return new Member(memberId, name, email);
  }

  get card(): MemberCard | null {
    return this._card;
  }

  hasCard(): boolean {
    return this._card !== null;
  }

  issueCard(cardId: CardId, cardNumber: string, now: Date): MemberCard {
    if (this.hasCard()) {
      throw new Error("MemberCard has already been issued");
    }
    const memberCard = MemberCard.create(cardId, cardNumber, now);
    this._card = memberCard;
    return memberCard;
  }
}

export { Member };
