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

  // Routes (both directions - the car goes and returns).
  const destinations = ["Chandigarh", "Peeragarhi (Delhi)", "Delhi IGI Airport"];
  const routes = destinations.flatMap((d) => [
    { origin: "Hisar", destination: d },
    { origin: d, destination: "Hisar" },
  ]);
  for (const r of routes) {
    await prisma.route.upsert({
      where: { origin_destination: { origin: r.origin, destination: r.destination } },
      update: {},
      create: r,
    });
  }

  // Cars: 4-seat Baleno (5-seater minus the driver), CNG + Petrol.
  const cars = [
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1001", totalSeats: 4, fuelType: "CNG + Petrol", driverName: "Suresh Kumar", driverPhone: "+91 98120 11001" },
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1002", totalSeats: 4, fuelType: "CNG + Petrol", driverName: "Rakesh Sharma", driverPhone: "+91 98120 11002" },
    { name: "Maruti Baleno", plateNumber: "HR-39-A-1003", totalSeats: 4, fuelType: "CNG + Petrol", driverName: "Vijay Singh", driverPhone: "+91 98120 11003" },
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

  // Schedules: outbound in the morning/afternoon, returns later in the day.
  // Bookable seats = 4 (Baleno minus driver). Rebuilt cleanly each seed.
  const OUTBOUND_TIMES = ["06:00", "14:00"];
  const RETURN_TIMES: Record<string, string[]> = {
    Chandigarh: ["12:00", "18:00"],
    "Peeragarhi (Delhi)": ["13:00", "19:00"],
    "Delhi IGI Airport": ["14:00", "20:00"],
  };

  const allRoutes = await prisma.route.findMany();

  // Pre-launch: cleanly rebuild schedules. Deleting trips cascades to any
  // test bookings/payments/reviews, so we start from a consistent state.
  await prisma.trip.deleteMany({});
  await prisma.tripSchedule.deleteMany({});

  for (const route of allRoutes) {
    const isReturn = route.destination === "Hisar";
    const times = isReturn
      ? RETURN_TIMES[route.origin] ?? ["12:00", "18:00"]
      : OUTBOUND_TIMES;
    for (const departureTime of times) {
      await prisma.tripSchedule.create({
        data: {
          routeId: route.id,
          departureTime,
          sharedSeatPrice: 500,
          privatePrice: 4000,
          seatsPerTrip: 4,
        },
      });
    }
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
