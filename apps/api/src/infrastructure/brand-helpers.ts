import type {
  BandId,
  BookingId,
  Brand,
  CardId,
  EquipmentId,
  EventId,
  MemberId,
  PaymentId,
  PolicyId,
  RequestId,
  RoomId,
  StudioId,
} from "@my-app/shared";

const toBrand = <BrandedType extends Brand<string, string>>(value: string): BrandedType =>
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  value as unknown as BrandedType;

const toBandId = (value: string): BandId => toBrand(value);
const toBookingId = (value: string): BookingId => toBrand(value);
const toCardId = (value: string): CardId => toBrand(value);
const toEquipmentId = (value: string): EquipmentId => toBrand(value);
const toEventId = (value: string): EventId => toBrand(value);
const toMemberId = (value: string): MemberId => toBrand(value);
const toPaymentId = (value: string): PaymentId => toBrand(value);
const toPolicyId = (value: string): PolicyId => toBrand(value);
const toRequestId = (value: string): RequestId => toBrand(value);
const toRoomId = (value: string): RoomId => toBrand(value);
const toStudioId = (value: string): StudioId => toBrand(value);

export {
  toBandId,
  toBookingId,
  toBrand,
  toCardId,
  toEquipmentId,
  toEventId,
  toMemberId,
  toPaymentId,
  toPolicyId,
  toRequestId,
  toRoomId,
  toStudioId,
};
