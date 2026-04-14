import type { CardId, MemberId } from "@my-app/shared";

import { Email } from "../../shared/email.js";
import { Member } from "../member.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const MEMBER_ID = "M-001" as MemberId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const CARD_ID = "C-001" as CardId;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const CARD_ID_2 = "C-002" as CardId;
const CARD_NUMBER = "CARD-0001";
const CARD_NUMBER_2 = "CARD-0002";

const makeEmail = (): Email => Email.create("test@example.com");

const makeNow = (): Date => new Date("2026-04-14T00:00:00Z");

describe("Member creation", () => {
  it("should create a valid member", () => {
    const email = makeEmail();
    const member = Member.create(MEMBER_ID, "Taro", email);

    expect(member.memberId).toBe(MEMBER_ID);
    expect(member.name).toBe("Taro");
    expect(member.email).toBe(email);
  });

  it("should reject empty name", () => {
    expect(() => Member.create(MEMBER_ID, "", makeEmail())).toThrow(
      "Member name must not be empty",
    );
  });
});

describe("Member issueCard", () => {
  it("should issue a card to a member without one", () => {
    const member = Member.create(MEMBER_ID, "Taro", makeEmail());
    const card = member.issueCard(CARD_ID, CARD_NUMBER, makeNow());

    expect(card.cardId).toBe(CARD_ID);
    expect(card.cardNumber).toBe(CARD_NUMBER);
  });

  it("should reject issuing a second card (BR-10)", () => {
    const member = Member.create(MEMBER_ID, "Taro", makeEmail());
    member.issueCard(CARD_ID, CARD_NUMBER, makeNow());

    expect(() => member.issueCard(CARD_ID_2, CARD_NUMBER_2, makeNow())).toThrow(
      "MemberCard has already been issued",
    );
  });
});

describe("Member hasCard", () => {
  it("should return false when no card issued", () => {
    const member = Member.create(MEMBER_ID, "Taro", makeEmail());

    // oxlint-disable-next-line vitest/prefer-to-be-falsy
    expect(member.hasCard()).toBe(false);
  });

  it("should return true after card is issued", () => {
    const member = Member.create(MEMBER_ID, "Taro", makeEmail());
    member.issueCard(CARD_ID, CARD_NUMBER, makeNow());

    // oxlint-disable-next-line vitest/prefer-to-be-truthy
    expect(member.hasCard()).toBe(true);
  });
});
