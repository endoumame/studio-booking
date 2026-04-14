import { toCardId, toEventId } from "../../infrastructure/brand-helpers.js";
import type { Booking } from "../../domain/booking/booking.js";
import type { BookingId } from "@my-app/shared";
import type { BookingRepository } from "../../domain/booking/booking-repository.js";
import type { DomainEvent } from "../../domain/shared/events/domain-event.js";
import type { Member } from "../../domain/member/member.js";
import type { MemberRepository } from "../../domain/member/member-repository.js";

interface CheckInInput {
  bookingId: BookingId;
}

interface CheckInDeps {
  bookingRepo: BookingRepository;
  memberRepo: MemberRepository;
}

const FIRST_EVENT_VERSION = 1;
const CARD_NUMBER_LENGTH = 16;
const DECIMAL_BASE = 10;

const loadBooking = async (
  bookingRepo: BookingRepository,
  bookingId: BookingId,
): Promise<Booking> => {
  const booking = await bookingRepo.findById(bookingId);
  if (booking === null) {
    throw new Error(`Booking ${bookingId} not found`);
  }
  return booking;
};

const loadMember = async (memberRepo: MemberRepository, booking: Booking): Promise<Member> => {
  const member = await memberRepo.findById(booking.memberId);
  if (member === null) {
    throw new Error(`Member ${booking.memberId} not found`);
  }
  return member;
};

const generateCardNumber = (): string =>
  [...crypto.getRandomValues(new Uint8Array(CARD_NUMBER_LENGTH))]
    .map((byte) => String(byte % DECIMAL_BASE))
    .join("");

const issueCardIfNeeded = async (member: Member, deps: CheckInDeps): Promise<DomainEvent[]> => {
  if (member.hasCard()) {
    return [];
  }

  const cardId = toCardId(crypto.randomUUID());
  const cardNumber = generateCardNumber();
  member.issueCard(cardId, cardNumber, new Date());
  await deps.memberRepo.save(member);

  const cardEvent: DomainEvent = {
    cardId,
    cardNumber,
    eventId: toEventId(crypto.randomUUID()),
    memberId: member.memberId,
    occurredAt: new Date(),
    type: "MemberCardIssued",
    version: FIRST_EVENT_VERSION,
  };

  return [cardEvent];
};

const buildCheckInEvents = (bookingId: BookingId): DomainEvent[] => [
  {
    bookingId,
    eventId: toEventId(crypto.randomUUID()),
    occurredAt: new Date(),
    type: "BookingCheckedIn",
    version: FIRST_EVENT_VERSION,
  },
  {
    bookingId,
    eventId: toEventId(crypto.randomUUID()),
    occurredAt: new Date(),
    type: "BookingInUse",
    version: FIRST_EVENT_VERSION,
  },
];

const checkIn = async (input: CheckInInput, deps: CheckInDeps): Promise<Booking> => {
  const existing = await loadBooking(deps.bookingRepo, input.bookingId);
  const member = await loadMember(deps.memberRepo, existing);
  const cardEvents = await issueCardIfNeeded(member, deps);
  const checkedIn = existing.checkIn();
  const inUse = checkedIn.startUse();
  const bookingEvents = buildCheckInEvents(input.bookingId);
  const events: DomainEvent[] = [...cardEvents, ...bookingEvents];
  await deps.bookingRepo.save(inUse, events);

  return inUse;
};

export { checkIn };
export type { CheckInDeps, CheckInInput };
