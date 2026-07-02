import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp } from "@/lib/otp";
import { sendMail, otpEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const code = await issueOtp(email);
  const mail = otpEmail(code);
  const result = await sendMail({ to: email, ...mail });

  return NextResponse.json({
    ok: true,
    // In dev (no SMTP) we surface the code so you can test end-to-end.
    devCode: result.dev ? code : undefined,
  });
}
