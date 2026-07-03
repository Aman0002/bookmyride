import { randomUUID } from "crypto";
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
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid widget verification payload." }, { status: 400 });
    }

    const phone = parsed.data.phone.trim();
    const fallbackEmail = `${phone.replace(/\D/g, "")}-${randomUUID().slice(0, 8)}@bookmyride.local`;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ phone }],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          phone,
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
        },
      });
    } else {
      try {
        user = await prisma.user.create({
          data: {
            email: fallbackEmail,
            verified: true,
            phone,
            name: parsed.data.name,
            isAdmin: false,
          },
        });
      } catch (createError) {
        if (createError instanceof Error && createError.message.includes("Unique constraint")) {
          user = await prisma.user.findFirst({
            where: { phone },
          });
          if (!user) throw createError;
        } else {
          throw createError;
        }
      }
    }

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
  } catch (error) {
    console.error("widget-session error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Widget verification failed" },
      { status: 500 }
    );
  }
}
