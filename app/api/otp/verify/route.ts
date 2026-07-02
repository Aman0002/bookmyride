import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  const result = await verifyOtp(email, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      verified: true,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
    },
    create: {
      email,
      verified: true,
      name: parsed.data.name,
      phone: parsed.data.phone,
      isAdmin: email === adminEmail,
    },
  });

  await createSession({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
