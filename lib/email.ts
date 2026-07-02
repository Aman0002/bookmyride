import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail({ to, subject, html, text }: MailInput) {
  const transport = getTransport();
  const from = process.env.MAIL_FROM || "Book My Ride <no-reply@bookmyride.local>";

  // Dev fallback: no SMTP configured -> log to server console.
  if (!transport) {
    console.log("\n========== [DEV EMAIL] ==========");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    console.log("=================================\n");
    return { delivered: false, dev: true };
  }

  await transport.sendMail({ from, to, subject, html, text });
  return { delivered: true, dev: false };
}

const shell = (title: string, body: string) => `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#f4f6fb;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8f0">
      <div style="background:#0f766e;padding:20px 24px;color:#fff">
        <div style="font-size:20px;font-weight:700">Book My Ride</div>
        <div style="font-size:13px;opacity:.85">We pick you up from home.</div>
      </div>
      <div style="padding:24px;color:#1f2937;font-size:15px;line-height:1.6">
        <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
        ${body}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px">
        Book My Ride - Hisar. If you did not request this, you can ignore this email.
      </div>
    </div>
  </div>`;

export function otpEmail(code: string) {
  return {
    subject: `Your Book My Ride code: ${code}`,
    html: shell(
      "Verify your email",
      `<p>Use this one-time code to continue your booking:</p>
       <div style="font-size:32px;font-weight:800;letter-spacing:6px;background:#f0fdfa;color:#0f766e;padding:14px;border-radius:12px;text-align:center;margin:16px 0">${code}</div>
       <p style="color:#6b7280;font-size:13px">This code expires in 10 minutes.</p>`
    ),
    text: `Your Book My Ride verification code is ${code}. It expires in 10 minutes.`,
  };
}

export function bookingConfirmationEmail(input: {
  name: string;
  bookingId: string;
  route: string;
  date: string;
  time: string;
  type: string;
  seats: number;
  amount: number;
  paymentMode: string;
  pickupAddress: string;
  carName?: string | null;
  carPlate?: string | null;
  carFuel?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
}) {
  const rows: [string, string][] = [
    ["Booking ID", input.bookingId],
    ["Route", input.route],
    ["Date", input.date],
    ["Departure", input.time],
    ["Ride type", input.type === "PRIVATE" ? "Private car" : `Shared (${input.seats} seat${input.seats > 1 ? "s" : ""})`],
    ["Pickup", input.pickupAddress],
    ["Amount", `₹${input.amount}`],
    ["Payment", input.paymentMode === "COD" ? "Cash on pickup (COD)" : "Paid online"],
  ];
  if (input.carName)
    rows.push(["Car", `${input.carName}${input.carPlate ? ` (${input.carPlate})` : ""}`]);
  if (input.carFuel)
    rows.push(["Fuel", input.carFuel]);
  if (input.driverName)
    rows.push(["Driver", input.driverName]);
  if (input.driverPhone)
    rows.push(["Driver phone", input.driverPhone]);
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#6b7280;width:120px;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`
    )
    .join("");

  return {
    subject: `Booking confirmed - ${input.route} on ${input.date}`,
    html: shell(
      `Thanks ${input.name}, your ride is confirmed!`,
      `<p>Our driver will pick you up from your home address. Here are your details:</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">${table}</table>
       ${
         input.paymentMode === "COD"
           ? `<p style="margin-top:16px;background:#fffbeb;border:1px solid #fde68a;padding:10px 12px;border-radius:10px;color:#92400e;font-size:13px">Please keep <b>₹${input.amount}</b> ready to pay the driver at pickup.</p>`
           : ""
       }
       <p style="margin-top:16px;color:#6b7280;font-size:13px">Please be ready 10 minutes before departure.</p>`
    ),
    text: `Booking confirmed (${input.bookingId}). ${input.route} on ${input.date} at ${input.time}. Pickup: ${input.pickupAddress}. Amount ₹${input.amount} (${input.paymentMode}).`,
  };
}
