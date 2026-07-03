import crypto from "crypto";

export const DEFAULT_ADMIN_USERNAME = "adminbride";
export const DEFAULT_ADMIN_PASSWORD = "adminbride";

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyAdminPassword(password: string, hash: string) {
  return hashPassword(password) === hash;
}
