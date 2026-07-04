import crypto from "crypto";

export const DEFAULT_ADMIN_USERNAME = "adminbride";
export const DEFAULT_ADMIN_PASSWORD = "adminbride";

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyAdminPassword(password: string, hash: string) {
  return hashPassword(password) === hash;
}

export function normalizePhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function getAdminPhoneNumbers() {
  return (process.env.ADMIN_PHONE_NUMBERS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizePhoneNumber);
}

export function isAdminPhone(phone?: string | null) {
  if (!phone) return false;
  return getAdminPhoneNumbers().includes(normalizePhoneNumber(phone));
}
