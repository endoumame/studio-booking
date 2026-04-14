const BookingStatus = {
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  CANCELLED: "CANCELLED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CONFIRMED: "CONFIRMED",
  IN_USE: "IN_USE",
  TENTATIVE: "TENTATIVE",
} as const;
type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

const PaymentMethod = {
  ONLINE_CREDIT_CARD: "ONLINE_CREDIT_CARD",
  ON_SITE_CARD: "ON_SITE_CARD",
  ON_SITE_CASH: "ON_SITE_CASH",
} as const;
type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

const PaymentStatus = {
  COMPLETED: "COMPLETED",
  PARTIAL_REFUNDED: "PARTIAL_REFUNDED",
  PENDING: "PENDING",
  REFUNDED: "REFUNDED",
} as const;
type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

const ExtensionStatus = {
  APPROVED: "APPROVED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
} as const;
type ExtensionStatus = (typeof ExtensionStatus)[keyof typeof ExtensionStatus];

export { BookingStatus, ExtensionStatus, PaymentMethod, PaymentStatus };
export type {
  BookingStatus as BookingStatusType,
  ExtensionStatus as ExtensionStatusType,
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
};
