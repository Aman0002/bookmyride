import { prisma } from "./prisma";
import { recomputeTripStatus, assignCarForBooking } from "./trips";
import { sendMail, bookingConfirmationEmail } from "./email";
import { formatDate, formatTimeWindow } from "./utils";

// Mark a booking confirmed, recompute its trip, assign a car, and email.
export async function confirmAndNotify(bookingId: string) {
  const confirmed = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    select: { tripId: true },
  });

  await recomputeTripStatus(confirmed.tripId);
  await assignCarForBooking(bookingId);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { route: true } }, car: true, user: true },
  });
  if (!booking) return null;

  const mail = bookingConfirmationEmail({
    name: booking.passengerName || booking.user.name || "there",
    bookingId: booking.id.slice(-8).toUpperCase(),
    route: `${booking.trip.route.origin} → ${booking.trip.route.destination}`,
    date: formatDate(booking.trip.date),
    time: formatTimeWindow(booking.trip.departureTime, booking.trip.departureEndTime),
    type: booking.type,
    seats: booking.seats,
    amount: booking.amount,
    paymentMode: booking.paymentMode,
    pickupAddress: booking.pickupAddress,
    carName: booking.car?.name ?? null,
    carPlate: booking.car?.plateNumber ?? null,
    carFuel: booking.car?.fuelType ?? null,
    driverName: booking.car?.driverName ?? null,
    driverPhone: booking.car?.driverPhone ?? null,
  });

  await sendMail({ to: booking.user.email, ...mail });
  return booking;
}
