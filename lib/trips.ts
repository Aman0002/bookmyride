import { prisma } from "./prisma";
import { toDateOnly } from "./utils";

// Ensure concrete Trip rows exist for a route on a given date, generated from
// that route's active schedules (matching the weekday). Idempotent.
export async function ensureTripsForDate(routeId: string, date: Date) {
  const day = toDateOnly(date);
  const weekday = day.getDay(); // 0=Sun..6=Sat

  const schedules = await prisma.tripSchedule.findMany({
    where: { routeId, active: true },
  });
  const activeCars = await prisma.car.findMany({ where: { active: true } });

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
      const carId = await pickCarForSlot(day, s.departureTime, activeCars);
      await prisma.trip.create({
        data: {
          scheduleId: s.id,
          routeId,
          date: day,
          departureTime: s.departureTime,
          carId,
          seatsTotal: s.seatsPerTrip,
          seatsBooked: 0,
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
    include: { route: true, car: true },
  });
}

// Choose a car for a given date+time slot, preferring one not already busy at
// that exact time, then the least-loaded car for the day.
async function pickCarForSlot(
  day: Date,
  departureTime: string,
  activeCars: { id: string }[]
): Promise<string | null> {
  if (activeCars.length === 0) return null;

  const busyAtSlot = await prisma.trip.findMany({
    where: { date: day, departureTime, carId: { not: null } },
    select: { carId: true },
  });
  const busyIds = new Set(busyAtSlot.map((t) => t.carId));
  const free = activeCars.filter((c) => !busyIds.has(c.id));
  const pool = free.length > 0 ? free : activeCars;

  // Load-balance across the day.
  const dayStart = new Date(day);
  const dayEnd = new Date(day);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayTrips = await prisma.trip.findMany({
    where: { date: { gte: dayStart, lt: dayEnd }, carId: { not: null } },
    select: { carId: true },
  });
  const load = new Map<string, number>();
  for (const c of pool) load.set(c.id, 0);
  for (const t of dayTrips) {
    if (t.carId && load.has(t.carId)) load.set(t.carId, load.get(t.carId)! + 1);
  }
  pool.sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
  return pool[0].id;
}

// Recompute a trip's status from its bookings and seat counts.
export async function recomputeTripStatus(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { bookings: { where: { status: { not: "CANCELLED" } } } },
  });
  if (!trip) return;

  const hasPrivate = trip.bookings.some((b) => b.type === "PRIVATE");
  const seatsBooked = trip.bookings
    .filter((b) => b.type === "SHARED")
    .reduce((sum, b) => sum + b.seats, 0);

  let status = "OPEN";
  if (trip.status === "CANCELLED") status = "CANCELLED";
  else if (hasPrivate) status = "PRIVATE_BOOKED";
  else if (seatsBooked >= trip.seatsTotal) status = "FULL";

  await prisma.trip.update({
    where: { id: tripId },
    data: { seatsBooked, status },
  });
}
