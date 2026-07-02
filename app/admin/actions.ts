"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ensureTripsForDate } from "@/lib/trips";
import { recomputeTripStatus } from "@/lib/trips";
import { confirmAndNotify } from "@/lib/booking";
import { toDateOnly } from "@/lib/utils";

async function guard() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");
}

export async function confirmBooking(formData: FormData) {
  await guard();
  const id = String(formData.get("bookingId"));
  await confirmAndNotify(id);
  revalidatePath("/admin");
}

export async function cancelBooking(formData: FormData) {
  await guard();
  const id = String(formData.get("bookingId"));
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  await recomputeTripStatus(booking.tripId);
  revalidatePath("/admin");
}

export async function addRoute(formData: FormData) {
  await guard();
  const origin = String(formData.get("origin")).trim();
  const destination = String(formData.get("destination")).trim();
  if (!origin || !destination) return;
  await prisma.route.upsert({
    where: { origin_destination: { origin, destination } },
    update: { active: true },
    create: { origin, destination },
  });
  revalidatePath("/admin/fleet");
}

export async function toggleRoute(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const route = await prisma.route.findUnique({ where: { id } });
  if (route) {
    await prisma.route.update({ where: { id }, data: { active: !route.active } });
  }
  revalidatePath("/admin/fleet");
}

export async function addCar(formData: FormData) {
  await guard();
  const name = String(formData.get("name")).trim();
  const plateNumber = String(formData.get("plateNumber")).trim();
  const totalSeats = Number(formData.get("totalSeats")) || 4;
  const fuelType = String(formData.get("fuelType") || "").trim() || null;
  const driverName = String(formData.get("driverName") || "").trim() || null;
  const driverPhone = String(formData.get("driverPhone") || "").trim() || null;
  if (!name || !plateNumber) return;
  await prisma.car.upsert({
    where: { plateNumber },
    update: { name, totalSeats, fuelType, driverName, driverPhone, active: true },
    create: { name, plateNumber, totalSeats, fuelType, driverName, driverPhone },
  });
  revalidatePath("/admin/fleet");
}

export async function toggleCar(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const car = await prisma.car.findUnique({ where: { id } });
  if (car) {
    await prisma.car.update({ where: { id }, data: { active: !car.active } });
  }
  revalidatePath("/admin/fleet");
}

export async function addSchedule(formData: FormData) {
  await guard();
  const routeId = String(formData.get("routeId"));
  const departureTime = String(formData.get("departureTime"));
  const sharedSeatPrice = Number(formData.get("sharedSeatPrice")) || 500;
  const privatePrice = Number(formData.get("privatePrice")) || 4000;
  const seatsPerTrip = Number(formData.get("seatsPerTrip")) || 6;
  const days = formData.getAll("days").map((d) => String(d));
  const daysOfWeek = days.length ? days.join(",") : "0,1,2,3,4,5,6";
  if (!routeId || !departureTime) return;
  await prisma.tripSchedule.create({
    data: {
      routeId,
      departureTime,
      daysOfWeek,
      sharedSeatPrice,
      privatePrice,
      seatsPerTrip,
    },
  });
  revalidatePath("/admin/schedules");
}

export async function toggleSchedule(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const s = await prisma.tripSchedule.findUnique({ where: { id } });
  if (s) {
    await prisma.tripSchedule.update({
      where: { id },
      data: { active: !s.active },
    });
  }
  revalidatePath("/admin/schedules");
}

export async function deleteSchedule(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.tripSchedule.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/schedules");
}

export async function generateTrips(formData: FormData) {
  await guard();
  const routeId = String(formData.get("routeId"));
  const fromStr = String(formData.get("from"));
  const toStr = String(formData.get("to"));
  if (!fromStr || !toStr) return;

  const from = toDateOnly(fromStr);
  const to = toDateOnly(toStr);
  const routes =
    routeId === "ALL"
      ? await prisma.route.findMany({ where: { active: true } })
      : [{ id: routeId }];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    for (const r of routes) {
      await ensureTripsForDate(r.id, new Date(d));
    }
  }
  revalidatePath("/admin/schedules");
}

export async function approveDriver(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const app = await prisma.driverApplication.findUnique({ where: { id } });
  if (!app) return;
  // Add the driver's car to the fleet.
  await prisma.car.upsert({
    where: { plateNumber: app.plateNumber },
    update: { name: app.carModel, totalSeats: app.seats, fuelType: app.fuelType, active: true },
    create: {
      name: app.carModel,
      plateNumber: app.plateNumber,
      totalSeats: app.seats,
      fuelType: app.fuelType,
    },
  });
  await prisma.driverApplication.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/fleet");
}

export async function rejectDriver(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.driverApplication.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/drivers");
}

export async function updateServiceArea(formData: FormData) {
  await guard();
  const centerLat = Number(formData.get("centerLat"));
  const centerLng = Number(formData.get("centerLng"));
  const radiusKm = Number(formData.get("radiusKm"));
  const existing = await prisma.serviceArea.findFirst();
  if (existing) {
    await prisma.serviceArea.update({
      where: { id: existing.id },
      data: { centerLat, centerLng, radiusKm },
    });
  } else {
    await prisma.serviceArea.create({
      data: { name: "Hisar", centerLat, centerLng, radiusKm },
    });
  }
  revalidatePath("/admin/settings");
}
