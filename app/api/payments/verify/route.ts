import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verifySignature } from "@/lib/razorpay";
import { confirmAndNotify } from "@/lib/booking";

const schema = z.object({
  bookingId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }
  const d = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: d.bookingId },
    include: { payment: true },
  });
  if (!booking || booking.userId !== session.userId) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const valid = verifySignature({
    orderId: d.razorpayOrderId,
    paymentId: d.razorpayPaymentId,
    signature: d.razorpaySignature,
  });

  if (!valid) {
    await prisma.payment.updateMany({
      where: { bookingId: booking.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  await prisma.payment.updateMany({
    where: { bookingId: booking.id },
    data: {
      status: "PAID",
      razorpayPaymentId: d.razorpayPaymentId,
      razorpayOrderId: d.razorpayOrderId,
    },
  });

  await confirmAndNotify(booking.id);
  return NextResponse.json({ ok: true });
}
