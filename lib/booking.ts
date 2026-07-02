import { prisma } from "./prisma";
import { recomputeTripStatus } from "./trips";
import { sendMail, bookingConfirmationEmail } from "./email";
import { formatDate, formatTime12h } from "./utils";

// Mark a booking confirmed, recompute its trip, and email the customer.
export async function confirmAndNotify(bookingId: string) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: { trip: { include: { route: true, car: true } }, user: true },
  });

  await recomputeTripStatus(booking.tripId);

  const mail = bookingConfirmationEmail({
    name: booking.passengerName || booking.user.name || "there",
    bookingId: booking.id.slice(-8).toUpperCase(),
    route: `${booking.trip.route.origin} → ${booking.trip.route.destination}`,
    date: formatDate(booking.trip.date),
    time: formatTime12h(booking.trip.departureTime),
    type: booking.type,
    seats: booking.seats,
    amount: booking.amount,
    paymentMode: booking.paymentMode,
    pickupAddress: booking.pickupAddress,
    carName: booking.trip.car?.name ?? null,
    carPlate: booking.trip.car?.plateNumber ?? null,
    carFuel: booking.trip.car?.fuelType ?? null,
    driverName: booking.trip.car?.driverName ?? null,
    driverPhone: booking.trip.car?.driverPhone ?? null,
  });

  await sendMail({ to: booking.user.email, ...mail });
  return booking;
}
