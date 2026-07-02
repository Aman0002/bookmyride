import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePickup } from "@/lib/pickup";

const schema = z.object({
  address: z.string().trim().min(4),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a full pickup address." },
      { status: 400 }
    );
  }
  const result = await validatePickup(
    parsed.data.address,
    parsed.data.lat,
    parsed.data.lng
  );
  return NextResponse.json(result);
}
