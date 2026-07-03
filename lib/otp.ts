import { createHash, randomInt } from "crypto";
import { prisma } from "./prisma";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
export type OtpChannel = "SMS";

export type OtpTarget = {
  channel: OtpChannel;
  email?: string | null;
  phone?: string | null;
};

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function targetKey(target: OtpTarget) {
  if (target.channel === "SMS") {
    if (!target.phone) {
      throw new Error("Phone number is required for SMS OTPs.");
    }
    return target.phone;
  }

  if (!target.email) {
    throw new Error("Email is required for email OTPs.");
  }
  return target.email;
}

export async function issueOtp(target: OtpTarget): Promise<string> {
  const code = generateCode();
  const key = targetKey(target);
  // Invalidate previous unconsumed codes for this delivery target.
  await prisma.otpCode.updateMany({
    where: { email: key, consumed: false },
    data: { consumed: true },
  });
  await prisma.otpCode.create({
    data: {
      email: key,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(
  target: OtpTarget,
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  const key = targetKey(target);
  const record = await prisma.otpCode.findFirst({
    where: { email: key, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, reason: "No active code. Request a new one." };
  if (record.expiresAt < new Date())
    return { ok: false, reason: "Code expired. Request a new one." };
  if (record.attempts >= MAX_ATTEMPTS)
    return { ok: false, reason: "Too many attempts. Request a new one." };

  if (record.codeHash !== hashCode(code)) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "Incorrect code." };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });
  return { ok: true };
}
