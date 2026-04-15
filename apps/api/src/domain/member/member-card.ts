import { addPoints, subtractPoints } from "../shared/point.js";
import { err, ok } from "neverthrow";
import type { CardId } from "@my-app/shared";
import type { DomainError } from "../shared/errors.js";
import type { Point } from "../shared/point.js";
import type { Result } from "neverthrow";
import { validation } from "../shared/errors.js";

const MIN_CARD_NUMBER_LENGTH = 0;

interface MemberCard {
  readonly cardId: CardId;
  readonly cardNumber: string;
  readonly points: Point;
  readonly issuedAt: Date;
}

interface CreateMemberCardProps {
  readonly cardId: CardId;
  readonly cardNumber: string;
  readonly points: Point;
  readonly issuedAt: Date;
}

const createMemberCard = (props: CreateMemberCardProps): Result<MemberCard, DomainError> => {
  if (props.cardNumber.trim().length === MIN_CARD_NUMBER_LENGTH) {
    return err(validation("Card number must not be empty"));
  }
  return ok({
    cardId: props.cardId,
    cardNumber: props.cardNumber.trim(),
    issuedAt: props.issuedAt,
    points: props.points,
  });
};

const earnPoints = (card: MemberCard, amount: Point): MemberCard => ({
  ...card,
  points: addPoints(card.points, amount),
});

const usePoints = (card: MemberCard, amount: Point): Result<MemberCard, DomainError> =>
  subtractPoints(card.points, amount).map((remaining) => ({
    ...card,
    points: remaining,
  }));

export { createMemberCard, earnPoints, usePoints };
export type { CreateMemberCardProps, MemberCard };
