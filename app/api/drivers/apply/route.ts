import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DRIVER_COMMISSION_PCT } from "@/lib/constants";
import { sendMail } from "@/lib/email";

const schema = z.object({
  driverName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().email(),
  city: z.string().trim().min(2).default("Hisar"),
  carModel: z.string().trim().min(2),
  plateNumber: z.string().trim().min(4),
  seats: z.number().int().min(2).max(15).default(4),
  fuelType: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill all required fields correctly." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const application = await prisma.driverApplication.create({
    data: {
      driverName: d.driverName,
      phone: d.phone,
      email: d.email.toLowerCase(),
      city: d.city,
      carModel: d.carModel,
      plateNumber: d.plateNumber.toUpperCase(),
      seats: d.seats,
      fuelType: d.fuelType,
      message: d.message,
      commissionPct: DRIVER_COMMISSION_PCT,
    },
  });

  await sendMail({
    to: d.email,
    subject: "We received your Book My Ride partner application",
    html: `<p>Hi ${d.driverName},</p><p>Thanks for applying to drive with Book My Ride. Our team will review your car (${d.carModel}, ${d.plateNumber}) and get back to you shortly. Our platform fee is just ${DRIVER_COMMISSION_PCT}% per fare.</p>`,
    text: `Hi ${d.driverName}, thanks for applying to drive with Book My Ride. We'll review your ${d.carModel} (${d.plateNumber}) and get back to you. Platform fee: ${DRIVER_COMMISSION_PCT}%.`,
  });

  return NextResponse.json({ ok: true, id: application.id });
}
