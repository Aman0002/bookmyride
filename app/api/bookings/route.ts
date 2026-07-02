import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { validatePickup } from "@/lib/pickup";
import { createOrder } from "@/lib/razorpay";
import { confirmAndNotify } from "@/lib/booking";
import { recomputeTripStatus, computeAvailability } from "@/lib/trips";
import { DEFAULT_SEATS } from "@/lib/constants";

const schema = z.object({
  tripId: z.string(),
  type: z.enum(["SHARED", "PRIVATE"]),
  seats: z.number().int().min(1).max(10).default(1),
  paymentMode: z.enum(["ONLINE", "COD"]),
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

  // Re-validate pickup server-side (never trust the client).
  const pickup = await validatePickup(d.pickupAddress, d.pickupLat, d.pickupLng);
  if (!pickup.ok || pickup.lat == null || pickup.lng == null) {
    return NextResponse.json({ error: pickup.message }, { status: 400 });
  }

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
      pickupAddress: pickup.formattedAddress,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
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

  // ONLINE: create payment + Razorpay order.
  const order = await createOrder(amount, booking.id.slice(-12));
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      razorpayOrderId: order.orderId,
      amount,
      status: "CREATED",
    },
  });

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
    confirmed: false,
    payment: {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      mock: order.mock,
    },
  });
}
