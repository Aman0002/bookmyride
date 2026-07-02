import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  }
  const { bookingId, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true, review: true },
  });
  if (!booking || booking.userId !== session.userId) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Only confirmed rides can be rated." },
      { status: 400 }
    );
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (booking.trip.date >= now) {
    return NextResponse.json(
      { error: "You can rate a ride after it's completed." },
      { status: 400 }
    );
  }
  if (booking.review) {
    return NextResponse.json(
      { error: "You've already rated this ride." },
      { status: 400 }
    );
  }

  await prisma.review.create({
    data: { bookingId, userId: session.userId, rating, comment },
  });

  return NextResponse.json({ ok: true });
}
