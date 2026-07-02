export const BOOKING_TYPES = ["SHARED", "PRIVATE"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const PAYMENT_MODES = ["ONLINE", "COD"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const TRIP_STATUSES = [
  "OPEN",
  "PRIVATE_BOOKED",
  "FULL",
  "CANCELLED",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const PAYMENT_STATUSES = ["CREATED", "PAID", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DEFAULT_PRIVATE_PRICE = 4000;
export const DEFAULT_SHARED_PRICE = 500;
export const DEFAULT_SEATS = 4;

export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const DRIVER_COMMISSION_PCT = 7;

export const BRAND = {
  name: "Book My Ride",
  tagline: "We pick you up from home.",
  phone: "+91 90000 00000",
  email: "hello@bookmyride.in",
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
