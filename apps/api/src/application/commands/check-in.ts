import type { BookingId, MemberId } from "@my-app/shared";
import { checkInBooking, startBookingUse } from "../../domain/booking/booking.js";
import { err, ok } from "neverthrow";
import { toCardId, toEventId } from "../../infrastructure/brand-helpers.js";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainError } from "../../domain/shared/errors.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Member } from "../../domain/member/member.js";
import type { MemberRepository } from "../../domain/member/member-repository.js";
import type { Result } from "neverthrow";
import { issueCard } from "../../domain/member/member.js";
import { notFound } from "../../domain/shared/errors.js";

const INITIAL_VERSION = 1;
const INITIAL_POINTS_VALUE = 0;
const CARD_NUMBER_PREFIX = "MC-";
const CARD_SUFFIX_START = 0;
const CARD_SUFFIX_LENGTH = 8;

interface CheckInInput {
  readonly bookingId: BookingId;
  readonly memberId: MemberId;
}

interface CheckInDeps {
  readonly bookingRepo: BookingRepository;
  readonly memberRepo: MemberRepository;
}

interface CheckInResult {
  readonly booking: Booking;
  readonly member: Member;
}

const buildCheckedInEvent = (bookingId: BookingId): DomainEvent => ({
  bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  type: "BookingCheckedIn",
  version: INITIAL_VERSION,
});

const buildInUseEvent = (bookingId: BookingId): DomainEvent => ({
  bookingId,
  eventId: toEventId(crypto.randomUUID()),
  occurredAt: new Date(),
  type: "BookingInUse",
  version: INITIAL_VERSION,
});

const generateCardNumber = (): string =>
  `${CARD_NUMBER_PREFIX}${crypto.randomUUID().slice(CARD_SUFFIX_START, CARD_SUFFIX_LENGTH)}`;

const issueCardIfNeeded = (member: Member): Result<Member, DomainError> => {
  if (member.card !== null) {
    return ok(member);
  }
  return issueCard(member, {
    cardId: toCardId(crypto.randomUUID()),
    cardNumber: generateCardNumber(),
    issuedAt: new Date(),
    points: { value: INITIAL_POINTS_VALUE },
  });
};

const buildCardEvent = (member: Member): readonly DomainEvent[] => {
  if (member.card === null) {
    return [];
  }
  return [
    {
      cardId: member.card.cardId,
      cardNumber: member.card.cardNumber,
      eventId: toEventId(crypto.randomUUID()),
      memberId: member.memberId,
      occurredAt: new Date(),
      type: "MemberCardIssued" as const,
      version: INITIAL_VERSION,
    },
  ];
};

const loadBooking = async (
  input: CheckInInput,
  deps: CheckInDeps,
): Promise<Result<Booking, DomainError>> => {
  const result = await deps.bookingRepo.findById(input.bookingId);
  return result.andThen((booking) => {
    if (booking === null) {
      return err(notFound("Booking not found"));
    }
    return ok(booking);
  });
};

const loadMember = async (
  input: CheckInInput,
  deps: CheckInDeps,
): Promise<Result<Member, DomainError>> => {
  const result = await deps.memberRepo.findById(input.memberId);
  return result.andThen((member) => {
    if (member === null) {
      return err(notFound("Member not found"));
    }
    return ok(member);
  });
};

const performCheckIn = (booking: Booking): Result<Booking, DomainError> =>
  checkInBooking(booking).andThen((checkedIn) => startBookingUse(checkedIn));

const applyDomainUpdates = (
  bookingResult: Result<Booking, DomainError>,
  memberResult: Result<Member, DomainError>,
): Result<{ booking: Booking; member: Member }, DomainError> => {
  if (bookingResult.isErr()) {
    return err(bookingResult.error);
  }
  if (memberResult.isErr()) {
    return err(memberResult.error);
  }

  return performCheckIn(bookingResult.value).andThen((booking) =>
    issueCardIfNeeded(memberResult.value).map((member) => ({ booking, member })),
  );
};

const saveResults = async (
  deps: CheckInDeps,
  booking: Booking,
  member: Member,
): Promise<Result<CheckInResult, DomainError>> => {
  const bookingEvents: readonly DomainEvent[] = [
    buildCheckedInEvent(booking.bookingId),
    buildInUseEvent(booking.bookingId),
  ];
  const memberEvents = buildCardEvent(member);

  const bookingSave = await deps.bookingRepo.save(booking, bookingEvents);
  if (bookingSave.isErr()) {
    return err(bookingSave.error);
  }

  const memberSave = await deps.memberRepo.save(member, memberEvents);
  return memberSave.map(() => ({ booking, member }));
};

const checkInCommand = async (
  input: CheckInInput,
  deps: CheckInDeps,
): Promise<Result<CheckInResult, DomainError>> => {
  const bookingResult = await loadBooking(input, deps);
  const memberResult = await loadMember(input, deps);

  const processed = applyDomainUpdates(bookingResult, memberResult);
  if (processed.isErr()) {
    return err(processed.error);
  }

  return saveResults(deps, processed.value.booking, processed.value.member);
};

export { checkInCommand };
export type { CheckInDeps, CheckInInput, CheckInResult };
