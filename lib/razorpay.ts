import { createHmac } from "crypto";
import Razorpay from "razorpay";

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
}

export type CreatedOrder = {
  orderId: string;
  amount: number;
  currency: string;
  mock: boolean;
};

// Create a Razorpay order (paise). In dev without keys, returns a mock order.
export async function createOrder(
  amountInr: number,
  receipt: string
): Promise<CreatedOrder> {
  const amount = amountInr * 100;
  if (!isRazorpayConfigured()) {
    return {
      orderId: `mock_order_${receipt}_${Date.now()}`,
      amount,
      currency: "INR",
      mock: true,
    };
  }
  const client = getClient();
  const order = await client.orders.create({
    amount,
    currency: "INR",
    receipt,
  });
  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    mock: false,
  };
}

// Verify the payment signature returned by Razorpay checkout.
export function verifySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  // Mock orders (dev) auto-verify.
  if (!isRazorpayConfigured() || input.orderId.startsWith("mock_order_")) {
    return true;
  }
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return expected === input.signature;
}
