const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY?.trim();
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID?.trim();
const MSG91_DLT_TEMPLATE_ID = process.env.MSG91_DLT_TEMPLATE_ID?.trim();
const MSG91_DLT_ENTITY_ID = process.env.MSG91_DLT_ENTITY_ID?.trim();
const FALLBACK_SENDER_ID = "BKMRID";

function normalizeMobile(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function otpMessage(code: string) {
  return `Your BookMyRide OTP is ${code}.\n\nThis OTP is valid for 5 minutes.\n\nPlease do not share it with anyone.`;
}

function safePreview(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function sendOtpSms(phone: string, code: string) {
  const authKey = MSG91_AUTH_KEY;
  if (!authKey) {
    console.log("\n========== [DEV SMS] ==========");
    console.log(`To:      ${phone}`);
    console.log(otpMessage(code));
    console.log("================================\n");
    return { delivered: false, dev: true };
  }

  const sender = MSG91_SENDER_ID || FALLBACK_SENDER_ID;
  if (!MSG91_SENDER_ID) {
    console.warn(
      `[MSG91] MSG91_SENDER_ID is not set. Falling back to ${FALLBACK_SENDER_ID}.`
    );
  }
  if (!MSG91_DLT_TEMPLATE_ID) {
    throw new Error("MSG91_DLT_TEMPLATE_ID is required for DLT-compliant SMS delivery.");
  }
  if (!MSG91_DLT_ENTITY_ID) {
    throw new Error("MSG91_DLT_ENTITY_ID is required for DLT-compliant SMS delivery.");
  }

  const url = new URL("https://api.msg91.com/api/v2/sendsms");
  url.searchParams.set("authkey", authKey);
  url.searchParams.set("mobiles", normalizeMobile(phone));
  url.searchParams.set("message", otpMessage(code));
  url.searchParams.set("sender", sender);
  url.searchParams.set("route", "4");
  url.searchParams.set("country", "91");
  url.searchParams.set("DLT_TE_ID", MSG91_DLT_TEMPLATE_ID);
  url.searchParams.set("DLT_PE_ID", MSG91_DLT_ENTITY_ID);

  const res = await fetch(url.toString(), { method: "GET" });
  const rawBody = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`MSG91 SMS request failed (${res.status})${rawBody ? `: ${rawBody}` : ""}`);
  }

  let parsedBody: unknown = rawBody;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = rawBody;
  }

  const preview = safePreview(parsedBody);
  console.log(`[MSG91] sendOtpSms response for ${normalizeMobile(phone)}: ${preview}`);

  if (typeof parsedBody === "object" && parsedBody !== null) {
    const record = parsedBody as Record<string, unknown>;
    const type = String(record.type ?? "").toLowerCase();
    const message = safePreview(record.message ?? record.msg ?? record.error ?? parsedBody);
    if (type === "error" || record.error) {
      throw new Error(`MSG91 rejected the SMS request: ${message}`);
    }
  } else if (typeof parsedBody === "string") {
    const lower = parsedBody.toLowerCase();
    if (lower.includes("error") || lower.includes("invalid") || lower.includes("failed")) {
      throw new Error(`MSG91 rejected the SMS request: ${parsedBody}`);
    }
  }

  return { delivered: true, dev: false, providerResponse: preview };
}
