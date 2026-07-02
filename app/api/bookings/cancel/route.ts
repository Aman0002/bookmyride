import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { recomputeTripStatus } from "@/lib/trips";

const schema = z.object({ bookingId: z.string() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { trip: true },
  });
  if (!booking || booking.userId !== session.userId) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "Already cancelled." }, { status: 400 });
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (booking.trip.date < now) {
    return NextResponse.json(
      { error: "Past rides cannot be cancelled." },
      { status: 400 }
    );
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
  await recomputeTripStatus(booking.tripId);

  return NextResponse.json({ ok: true });
}
