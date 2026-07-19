import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { validatePickup } from "@/lib/pickup";
import { createOrder } from "@/lib/razorpay";
import { confirmAndNotify } from "@/lib/booking";
import { recomputeTripStatus, computeAvailability, isTripExpired } from "@/lib/trips";
import { DEFAULT_SEATS } from "@/lib/constants";
import { HISAR_CENTER } from "@/lib/geo";

const schema = z.object({
  tripId: z.string(),
  type: z.enum(["SHARED", "PRIVATE"]),
  seats: z.number().int().min(1).max(10).default(1),
  paymentMode: z.enum(["COD"]),
  passengerName: z.string().trim().min(1),
  passengerPhone: z.string().trim().min(6),
  pickupAddress: z.string().trim().min(4),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking details." }, { status: 400 });
  }
  const d = parsed.data;

  const trip = await prisma.trip.findUnique({ where: { id: d.tripId } });
  if (!trip || trip.status === "CANCELLED") {
    return NextResponse.json({ error: "This trip is not available." }, { status: 400 });
  }

  if (isTripExpired(trip)) {
    return NextResponse.json(
      { error: "This departure has already passed and is no longer accepting bookings." },
      { status: 400 }
    );
  }

  // Preserve the exact address the user typed and only use validation for distance checks.
  const pickup = await validatePickup(d.pickupAddress, d.pickupLat, d.pickupLng);
  const pickupAddress = d.pickupAddress.trim();
  const pickupLat = pickup.lat ?? d.pickupLat ?? HISAR_CENTER.lat;
  const pickupLng = pickup.lng ?? d.pickupLng ?? HISAR_CENTER.lng;

  // Pooled availability + pricing.
  const avail = computeAvailability(trip);
  let amount: number;
  let seats: number;

  if (d.type === "PRIVATE") {
    if (!avail.canPrivate) {
      return NextResponse.json(
        { error: "No private car available for this departure." },
        { status: 400 }
      );
    }
    seats = DEFAULT_SEATS; // one whole car
    amount = trip.privatePrice;
  } else {
    if (d.seats > DEFAULT_SEATS) {
      return NextResponse.json(
        { error: `A shared booking can be at most ${DEFAULT_SEATS} seats. For more, book a private car.` },
        { status: 400 }
      );
    }
    if (!avail.canShare || d.seats > avail.sharedSeatsLeft) {
      return NextResponse.json(
        { error: `Only ${avail.sharedSeatsLeft} seat(s) left.` },
        { status: 400 }
      );
    }
    seats = d.seats;
    amount = trip.sharedSeatPrice * d.seats;
  }

  const booking = await prisma.booking.create({
    data: {
      userId: session.userId,
      tripId: trip.id,
      type: d.type,
      seats,
      amount,
      paymentMode: d.paymentMode,
      pickupAddress,
      pickupLat,
      pickupLng,
      pickupDistanceKm: pickup.distanceKm ?? 0,
      passengerName: d.passengerName,
      passengerPhone: d.passengerPhone,
      status: "PENDING",
    },
  });

  // Hold the seat(s) immediately so concurrent bookings see reduced availability.
  await recomputeTripStatus(trip.id);

  if (d.paymentMode === "COD") {
    await confirmAndNotify(booking.id);
    return NextResponse.json({ ok: true, bookingId: booking.id, confirmed: true });
  }

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
    confirmed: true,
  });
}
