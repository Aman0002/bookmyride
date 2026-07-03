import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueOtp, type OtpChannel } from "@/lib/otp";
import { sendMail, otpEmail } from "@/lib/email";
import { sendOtpSms } from "@/lib/msg91";

const schema = z.object({
  phone: z.string().trim().optional(),
  channel: z.enum(["SMS"]).default("SMS"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid contact details required" }, { status: 400 });
  }
  try {
    const { channel } = parsed.data;
    const phone = parsed.data.phone?.trim();

    if (!phone) {
      return NextResponse.json(
        { error: "Mobile number is required for SMS verification." },
        { status: 400 }
      );
    }

    const code = await issueOtp({
      channel: channel as OtpChannel,
      phone: phone ?? null,
    });

    const result = await sendOtpSms(phone as string, code);

    return NextResponse.json({
      ok: true,
      // In dev (no SMTP / no MSG91 config) we surface the code so you can test end-to-end.
      devCode: result.dev ? code : undefined,
      providerResponse:
        process.env.NODE_ENV !== "production" ? result.providerResponse : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
