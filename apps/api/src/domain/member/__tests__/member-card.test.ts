import type { CardId } from "@my-app/shared";

import { MemberCard } from "../member-card.js";
import { Point } from "../../shared/point.js";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const CARD_ID = "C-001" as CardId;
const CARD_NUMBER = "CARD-0001";
const INITIAL_POINTS = 0;
const EARN_AMOUNT = 100;
const USE_AMOUNT = 30;
const REMAINING_AFTER_USE = 70;
const EXCESSIVE_AMOUNT = 200;

const makeNow = (): Date => new Date("2026-04-14T00:00:00Z");

describe("MemberCard creation", () => {
  it("should create a card with zero initial points", () => {
    const card = MemberCard.create(CARD_ID, CARD_NUMBER, makeNow());

    expect(card.cardId).toBe(CARD_ID);
    expect(card.cardNumber).toBe(CARD_NUMBER);
    expect(card.points.value).toBe(INITIAL_POINTS);
  });

  it("should reject empty card number", () => {
    expect(() => MemberCard.create(CARD_ID, "", makeNow())).toThrow(
      "Card number must not be empty",
    );
  });
});

describe("MemberCard earnPoints", () => {
  it("should increase points balance", () => {
    const card = MemberCard.create(CARD_ID, CARD_NUMBER, makeNow());

    card.earnPoints(Point.create(EARN_AMOUNT));

    expect(card.points.value).toBe(EARN_AMOUNT);
  });
});

describe("MemberCard usePoints", () => {
  it("should decrease points balance", () => {
    const card = MemberCard.create(CARD_ID, CARD_NUMBER, makeNow());
    card.earnPoints(Point.create(EARN_AMOUNT));

    card.usePoints(Point.create(USE_AMOUNT));

    expect(card.points.value).toBe(REMAINING_AFTER_USE);
  });

  it("should reject when insufficient points", () => {
    const card = MemberCard.create(CARD_ID, CARD_NUMBER, makeNow());
    card.earnPoints(Point.create(EARN_AMOUNT));

    expect(() => {
      card.usePoints(Point.create(EXCESSIVE_AMOUNT));
    }).toThrow("Insufficient points");
  });
});
