import { prisma } from "./prisma";
import { toDateOnly } from "./utils";
import { DEFAULT_SEATS } from "./constants";

const SEATS_PER_CAR = DEFAULT_SEATS;

// Ensure a concrete pooled Trip exists for a route on a given date, generated
// from that route's active schedules (matching the weekday). Idempotent.
export async function ensureTripsForDate(routeId: string, date: Date) {
  const day = toDateOnly(date);
  const weekday = day.getDay(); // 0=Sun..6=Sat

  const schedules = await prisma.tripSchedule.findMany({
    where: { routeId, active: true },
  });

  for (const s of schedules) {
    const days = s.daysOfWeek.split(",").map((d) => Number(d.trim()));
    if (!days.includes(weekday)) continue;

    const existing = await prisma.trip.findUnique({
      where: {
        routeId_date_departureTime: {
          routeId,
          date: day,
          departureTime: s.departureTime,
        },
      },
    });
    if (!existing) {
      const carsTotal = s.carsCount > 0 ? s.carsCount : 1;
      await prisma.trip.create({
        data: {
          scheduleId: s.id,
          routeId,
          date: day,
          departureTime: s.departureTime,
          departureEndTime: s.departureEndTime,
          carsTotal,
          seatsTotal: carsTotal * SEATS_PER_CAR,
          seatsBooked: 0,
          privateCarsBooked: 0,
          sharedSeatPrice: s.sharedSeatPrice,
          privatePrice: s.privatePrice,
          status: "OPEN",
        },
      });
    }
  }

  return prisma.trip.findMany({
    where: { routeId, date: day, status: { not: "CANCELLED" } },
    orderBy: { departureTime: "asc" },
    include: { route: true },
  });
}

export type Availability = {
  sharedSeatsLeft: number;
  sharedCapacity: number;
  canShare: boolean;
  canPrivate: boolean;
  isExpired: boolean;
};

function parseTripDateTime(date: Date | string, hhmm: string) {
  const base = new Date(typeof date === "string" ? date : date);
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  base.setHours(hours, minutes, 0, 0);
  return base;
}

export function isTripExpired(trip: {
  date: Date | string;
  departureTime: string;
  departureEndTime?: string | null;
}) {
  const tripDate = toDateOnly(trip.date);
  const tripStart = parseTripDateTime(tripDate, trip.departureTime);
  const tripEnd = trip.departureEndTime?.trim()
    ? parseTripDateTime(tripDate, trip.departureEndTime)
    : tripStart;
  return new Date() > tripEnd;
}

// Pooled availability: private bookings each reserve a whole car, shrinking the
// shared pool. A new private booking is only allowed if the already-booked
// shared seats still fit in the remaining (non-private) cars.
export function computeAvailability(trip: {
  carsTotal: number;
  seatsBooked: number;
  privateCarsBooked: number;
  status: string;
  date?: Date | string;
  departureTime?: string;
  departureEndTime?: string | null;
}): Availability {
  const expired =
    trip.date && trip.departureTime
      ? isTripExpired({
          date: trip.date,
          departureTime: trip.departureTime,
          departureEndTime: trip.departureEndTime,
        })
      : false;

  if (trip.status === "CANCELLED" || expired) {
    return {
      sharedSeatsLeft: 0,
      sharedCapacity: 0,
      canShare: false,
      canPrivate: false,
      isExpired: true,
    };
  }

  const carsForShared = trip.carsTotal - trip.privateCarsBooked;
  const sharedCapacity = carsForShared * SEATS_PER_CAR;
  const sharedSeatsLeft = Math.max(sharedCapacity - trip.seatsBooked, 0);
  const canShare = sharedSeatsLeft > 0;
  const canPrivate =
    trip.privateCarsBooked < trip.carsTotal &&
    trip.seatsBooked <= (trip.carsTotal - trip.privateCarsBooked - 1) * SEATS_PER_CAR;
  return { sharedSeatsLeft, sharedCapacity, canShare, canPrivate, isExpired: false };
}

// Recompute a trip's shared seats, private cars, and OPEN/FULL status.
export async function recomputeTripStatus(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { bookings: { where: { status: { not: "CANCELLED" } } } },
  });
  if (!trip) return;

  const privateCarsBooked = trip.bookings.filter((b) => b.type === "PRIVATE").length;
  const seatsBooked = trip.bookings
    .filter((b) => b.type === "SHARED")
    .reduce((sum, b) => sum + b.seats, 0);

  const avail = computeAvailability({
    carsTotal: trip.carsTotal,
    seatsBooked,
    privateCarsBooked,
    status: trip.status,
  });

  let status = trip.status;
  if (status !== "CANCELLED") {
    status = avail.canShare || avail.canPrivate ? "OPEN" : "FULL";
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: { seatsBooked, privateCarsBooked, status },
  });
}

// Assign a specific car to a booking (for the post-booking driver/car reveal).
// Private -> a car with no other bookings on this trip. Shared -> the
// least-loaded non-private car with a free seat. Admin can rebalance later.
export async function assignCarForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  const activeCars = await prisma.car.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (activeCars.length === 0) return;

  // Existing (non-cancelled) car allocations on this trip, excluding this booking.
  const siblings = await prisma.booking.findMany({
    where: {
      tripId: booking.tripId,
      status: { not: "CANCELLED" },
      id: { not: booking.id },
      carId: { not: null },
    },
    select: { carId: true, type: true, seats: true },
  });

  const privateCarIds = new Set(
    siblings.filter((b) => b.type === "PRIVATE").map((b) => b.carId as string)
  );
  const sharedLoad = new Map<string, number>();
  for (const c of activeCars) sharedLoad.set(c.id, 0);
  for (const b of siblings) {
    if (b.type === "SHARED" && b.carId && sharedLoad.has(b.carId)) {
      sharedLoad.set(b.carId, (sharedLoad.get(b.carId) ?? 0) + b.seats);
    }
  }

  let chosen: string | null = null;
  if (booking.type === "PRIVATE") {
    // A car with no shared seats and not already private.
    chosen =
      activeCars.find(
        (c) => !privateCarIds.has(c.id) && (sharedLoad.get(c.id) ?? 0) === 0
      )?.id ?? null;
  } else {
    // Least-loaded non-private car that can fit these seats.
    const candidates = activeCars
      .filter((c) => !privateCarIds.has(c.id))
      .filter((c) => (sharedLoad.get(c.id) ?? 0) + booking.seats <= SEATS_PER_CAR)
      .sort((a, b) => (sharedLoad.get(a.id) ?? 0) - (sharedLoad.get(b.id) ?? 0));
    chosen = candidates[0]?.id ?? null;
  }

  if (chosen) {
    await prisma.booking.update({ where: { id: booking.id }, data: { carId: chosen } });
  }
}
