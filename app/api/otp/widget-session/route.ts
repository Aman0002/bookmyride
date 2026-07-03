import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().optional().transform((value) => value?.trim() || undefined),
  phone: z.string().trim().min(6),
  providerData: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid widget verification payload." }, { status: 400 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ phone: parsed.data.phone }],
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verified: true,
          phone: parsed.data.phone,
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
        },
      })
    : await prisma.user.create({
        data: {
          email: "",
          verified: true,
          phone: parsed.data.phone,
          name: parsed.data.name,
          isAdmin: false,
        },
      });

  await createSession({
    userId: user.id,
    email: user.email ?? user.phone ?? "",
    isAdmin: user.isAdmin,
  });

  return NextResponse.json({
    ok: true,
    isAdmin: user.isAdmin,
    providerResponse:
      process.env.NODE_ENV !== "production" && parsed.data.providerData
        ? parsed.data.providerData
        : undefined,
  });
}
