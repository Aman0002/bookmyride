import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/session";

const schema = z.object({
  code: z.string().length(6),
  phone: z.string().trim().optional(),
  channel: z.enum(["SMS"]).default("SMS"),
  name: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    if (!parsed.data.phone) {
      return NextResponse.json({ error: "Mobile number is required to verify SMS codes." }, { status: 400 });
    }

    const phone = parsed.data.phone.trim();
    const fallbackEmail = `${phone.replace(/\D/g, "")}@bookmyride.local`;

    const result = await verifyOtp(
      {
        channel: "SMS",
        phone,
      },
      parsed.data.code
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone }],
      },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            verified: true,
            ...(parsed.data.name ? { name: parsed.data.name } : {}),
            phone,
          },
        })
      : await prisma.user.create({
          data: {
            email: fallbackEmail,
            verified: true,
            name: parsed.data.name,
            phone,
            isAdmin: false,
          },
        });

    await createSession({
      userId: user.id,
      email: user.email ?? user.phone ?? "",
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
  } catch (error) {
    console.error("otp verify error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
