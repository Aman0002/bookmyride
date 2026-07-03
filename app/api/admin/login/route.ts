import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/session";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, verifyAdminPassword, hashPassword } from "@/lib/admin";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 400 });
  }

  const username = parsed.data.username.trim();
  const password = parsed.data.password;

  if (username !== DEFAULT_ADMIN_USERNAME) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  }

  const expectedHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
  if (!verifyAdminPassword(password, expectedHash)) {
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  }

  await createAdminSession({ username });
  return NextResponse.json({ ok: true });
}
