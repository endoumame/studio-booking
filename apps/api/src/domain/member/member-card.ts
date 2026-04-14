import type { CardId } from "@my-app/shared";

import { Point } from "../shared/point.js";

const INITIAL_POINTS = 0;
const MIN_LENGTH = 0;

interface MemberCardProps {
  cardId: CardId;
  cardNumber: string;
  issuedAt: Date;
}

class MemberCard {
  readonly cardId: CardId;
  readonly cardNumber: string;
  readonly issuedAt: Date;
  private _points: Point;

  private constructor(props: MemberCardProps, points: Point) {
    this.cardId = props.cardId;
    this.cardNumber = props.cardNumber;
    this.issuedAt = props.issuedAt;
    this._points = points;
  }

  static create(cardId: CardId, cardNumber: string, issuedAt: Date): MemberCard {
    if (cardNumber.length === MIN_LENGTH) {
      throw new Error("Card number must not be empty");
    }
    return new MemberCard({ cardId, cardNumber, issuedAt }, Point.create(INITIAL_POINTS));
  }

  get points(): Point {
    return this._points;
  }

  earnPoints(amount: Point): void {
    this._points = this._points.add(amount);
  }

  usePoints(amount: Point): void {
    if (amount.value > this._points.value) {
      throw new Error("Insufficient points");
    }
    this._points = this._points.subtract(amount);
  }
}

export { MemberCard };
