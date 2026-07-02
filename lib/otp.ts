import { createHash, randomInt } from "crypto";
import { prisma } from "./prisma";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function issueOtp(email: string): Promise<string> {
  const code = generateCode();
  // Invalidate previous unconsumed codes for this email.
  await prisma.otpCode.updateMany({
    where: { email, consumed: false },
    data: { consumed: true },
  });
  await prisma.otpCode.create({
    data: {
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  const record = await prisma.otpCode.findFirst({
    where: { email, consumed: false },
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
