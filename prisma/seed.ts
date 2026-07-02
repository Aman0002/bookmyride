import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HISAR_CENTER = { lat: 29.1492, lng: 75.7217 };

async function main() {
  // Service area (single row).
  const existingArea = await prisma.serviceArea.findFirst();
  if (!existingArea) {
    await prisma.serviceArea.create({
      data: {
        name: "Hisar",
        centerLat: HISAR_CENTER.lat,
        centerLng: HISAR_CENTER.lng,
        radiusKm: 10,
      },
    });
  }

  // The 4 daily departures. Each is a time window with 3 cars pooled.
  const SHARED_PRICE = 600;
  const PRIVATE_PRICE = 2400;
  const CARS_PER_DEPARTURE = 3;
  const SEATS_PER_CAR = 4;

  const departures = [
    { origin: "Hisar", destination: "Chandigarh", start: "07:00", end: "08:00" },
    { origin: "Chandigarh", destination: "Hisar", start: "12:30", end: "13:30" },
    { origin: "Hisar", destination: "Delhi (Peeragarhi)", start: "16:00", end: "17:00" },
    { origin: "Delhi (Peeragarhi)", destination: "Hisar", start: "19:30", end: "20:30" },
  ];

  // Upsert the current routes.
  for (const d of departures) {
    await prisma.route.upsert({
      where: { origin_destination: { origin: d.origin, destination: d.destination } },
      update: { active: true },
      create: { origin: d.origin, destination: d.destination },
    });
  }

  // Cars: 4-seat (5-seater minus the driver), CNG + Petrol.
  const cars = [
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1001", totalSeats: SEATS_PER_CAR, fuelType: "CNG + Petrol", driverName: "Suresh Kumar", driverPhone: "+91 98120 11001" },
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1002", totalSeats: SEATS_PER_CAR, fuelType: "CNG + Petrol", driverName: "Rakesh Sharma", driverPhone: "+91 98120 11002" },
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1003", totalSeats: SEATS_PER_CAR, fuelType: "CNG + Petrol", driverName: "Vijay Singh", driverPhone: "+91 98120 11003" },
  ];
  for (const c of cars) {
    await prisma.car.upsert({
      where: { plateNumber: c.plateNumber },
      update: {
        name: c.name,
        totalSeats: c.totalSeats,
        fuelType: c.fuelType,
        driverName: c.driverName,
        driverPhone: c.driverPhone,
      },
      create: c,
    });
  }

  // Pre-launch: cleanly rebuild trips + schedules. Deleting trips cascades to
  // any test bookings/payments/reviews, so we start from a consistent state.
  await prisma.trip.deleteMany({});
  await prisma.tripSchedule.deleteMany({});

  // Remove any routes that are no longer part of the current operation.
  const keepPairs = new Set(departures.map((d) => `${d.origin}=>${d.destination}`));
  const allRoutes = await prisma.route.findMany();
  for (const r of allRoutes) {
    if (!keepPairs.has(`${r.origin}=>${r.destination}`)) {
      await prisma.route.delete({ where: { id: r.id } }).catch(() => {});
    }
  }

  // One pooled schedule per departure (time window, 3 cars).
  for (const d of departures) {
    const route = await prisma.route.findUnique({
      where: { origin_destination: { origin: d.origin, destination: d.destination } },
    });
    if (!route) continue;
    await prisma.tripSchedule.create({
      data: {
        routeId: route.id,
        departureTime: d.start,
        departureEndTime: d.end,
        sharedSeatPrice: SHARED_PRICE,
        privatePrice: PRIVATE_PRICE,
        carsCount: CARS_PER_DEPARTURE,
        seatsPerTrip: CARS_PER_DEPARTURE * SEATS_PER_CAR,
      },
    });
  }

  // Admin user bootstrap.
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bookmyride.local";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { isAdmin: true },
    create: { email: adminEmail, name: "Admin", isAdmin: true, verified: true },
  });

  console.log("Seed complete. Admin:", adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
