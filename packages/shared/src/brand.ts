declare const __brand: unique symbol;

type Brand<Base, Tag extends string> = Base & { readonly [__brand]: Tag };

type StudioId = Brand<string, "StudioId">;
type RoomId = Brand<string, "RoomId">;
type EquipmentId = Brand<string, "EquipmentId">;
type PolicyId = Brand<string, "PolicyId">;
type MemberId = Brand<string, "MemberId">;
type CardId = Brand<string, "CardId">;
type BandId = Brand<string, "BandId">;
type BookingId = Brand<string, "BookingId">;
type PaymentId = Brand<string, "PaymentId">;
type RequestId = Brand<string, "RequestId">;
type EventId = Brand<string, "EventId">;

export type {
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
};
