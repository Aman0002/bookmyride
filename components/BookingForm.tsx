"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Users,
  Car,
  MapPin,
  CheckCircle2,
  Loader2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { DEFAULT_SEATS } from "@/lib/constants";

type RideType = "SHARED" | "PRIVATE";
type PayMode = "ONLINE" | "COD";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay)
      return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BookingForm({
  tripId,
  seatsLeft,
  canShare,
  canPrivate,
  sharedPrice,
  privatePrice,
  sharedCapacity,
  carsTotal,
  defaultName,
  defaultPhone,
}: {
  tripId: string;
  seatsLeft: number;
  canShare: boolean;
  canPrivate: boolean;
  sharedPrice: number;
  privatePrice: number;
  sharedCapacity: number;
  carsTotal: number;
  defaultName: string;
  defaultPhone: string;
}) {
  const [type, setType] = useState<RideType>(canShare ? "SHARED" : "PRIVATE");
  const [seats, setSeats] = useState(1);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState("");
  const [payMode, setPayMode] = useState<PayMode>("ONLINE");

  const [pickup, setPickup] = useState<{
    ok: boolean;
    lat: number | null;
    lng: number | null;
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  const amount = type === "PRIVATE" ? privatePrice : sharedPrice * seats;
  const isMockPayment = !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || !addressInputRef.current) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-google-places-script='true']"
    );

    const initAutocomplete = () => {
      const googleMaps = (window as Window & { google?: any }).google;
      if (!googleMaps?.maps?.places || !addressInputRef.current) return;

      const autocomplete = new googleMaps.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["formatted_address", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const geometry = place?.geometry?.location;
        if (!geometry) return;

        const formattedAddress = place.formatted_address || addressInputRef.current?.value || "";
        setAddress(formattedAddress);
        setSelectedCoords({ lat: geometry.lat(), lng: geometry.lng() });
        setPickup(null);
        void validateAddress(formattedAddress, geometry.lat(), geometry.lng());
      });
    };

    if (existingScript) {
      if ((window as Window & { google?: any }).google?.maps?.places) {
        initAutocomplete();
      } else {
        existingScript.addEventListener("load", initAutocomplete, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-google-places-script", "true");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);
  }, []);

  async function validateAddress(value: string, lat?: number | null, lng?: number | null) {
    setError("");
    setChecking(true);
    setPickup(null);
    try {
      const res = await fetch("/api/pickup/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: value, lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not validate address");
      const nextPickup = {
        ok: true,
        lat: data.lat ?? lat ?? null,
        lng: data.lng ?? lng ?? null,
        message: data.message || "Address saved for booking.",
      };
      setPickup(nextPickup);
      if (lat != null && lng != null) {
        setSelectedCoords({ lat, lng });
      }
      return true;
    } catch {
      const fallbackPickup = {
        ok: true,
        lat: lat ?? null,
        lng: lng ?? null,
        message: "Address saved for booking.",
      };
      setPickup(fallbackPickup);
      return true;
    } finally {
      setChecking(false);
    }
  }

  async function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location access is not available in this browser.");
      return;
    }

    setError("");
    setChecking(true);
    setPickup(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setAddress("Current location");
        setSelectedCoords({ lat, lng });
        setPickup({ ok: true, lat, lng, message: "Current location saved for booking." });
        setChecking(false);
      },
      (geoError) => {
        setError(geoError.message || "Could not access your location.");
        setChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit() {
    setError("");
    if (!address.trim()) {
      setError("Please enter a pickup address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          type,
          seats,
          paymentMode: payMode,
          passengerName: name,
          passengerPhone: phone,
          pickupAddress: address,
          pickupLat: pickup?.lat ?? undefined,
          pickupLng: pickup?.lng ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      if (data.confirmed) {
        setDoneId(data.bookingId);
        return;
      }
      await handlePayment(data.bookingId, data.payment);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyPayment(bookingId: string, payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Payment verification failed");
    setDoneId(bookingId);
  }

  async function handlePayment(
    bookingId: string,
    payment: {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      mock: boolean;
    }
  ) {
    // Mock mode (no Razorpay keys in dev): auto-verify.
    if (payment.mock || !payment.keyId) {
      await verifyPayment(bookingId, {
        razorpayOrderId: payment.orderId,
        razorpayPaymentId: `mock_pay_${Date.now()}`,
        razorpaySignature: "mock",
      });
      return;
    }

    const ok = await loadRazorpayScript();
    if (!ok) throw new Error("Could not load payment gateway.");

    await new Promise<void>((resolve, reject) => {
      const rzp = new (window as any).Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Book My Ride",
        description: "Ride booking",
        order_id: payment.orderId,
        prefill: { name, contact: phone },
        theme: { color: "#0f766e" },
        handler: async (resp: any) => {
          try {
            await verifyPayment(bookingId, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      });
      rzp.open();
    });
  }

  if (doneId) {
    return (
      <Card className="mt-6 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Booking confirmed!
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Booking ID <b>{doneId.slice(-8).toUpperCase()}</b>. Your driver and car
          details are now in{" "}
          <Link href="/account" className="font-medium text-brand-700 underline">
            My bookings
          </Link>{" "}
          and your confirmation email
          {payMode === "COD" ? " - please keep cash ready for pickup." : "."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account">
            <Button>View my bookings</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const maxSeats = Math.min(seatsLeft, 4);

  return (
    <Card className="mt-6 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Complete your booking</h2>

      {/* Ride type */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => canShare && setType("SHARED")}
          disabled={!canShare}
          className={`rounded-xl border p-4 text-left transition ${
            type === "SHARED"
              ? "border-brand-600 bg-brand-50"
              : "border-slate-200 hover:border-slate-300"
          } ${!canShare ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Users className="h-5 w-5 text-brand-700" />
          <div className="mt-2 font-semibold text-slate-900">Shared ride</div>
          <div className="text-sm text-slate-500">
            {canShare ? `${formatINR(sharedPrice)}/seat` : "Sold out"}
          </div>
        </button>
        <button
          type="button"
          onClick={() => canPrivate && setType("PRIVATE")}
          disabled={!canPrivate}
          className={`rounded-xl border p-4 text-left transition ${
            type === "PRIVATE"
              ? "border-brand-600 bg-brand-50"
              : "border-slate-200 hover:border-slate-300"
          } ${!canPrivate ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Car className="h-5 w-5 text-brand-700" />
          <div className="mt-2 font-semibold text-slate-900">Book the whole car</div>
          <div className="text-sm text-slate-500">
            {canPrivate ? `${formatINR(privatePrice)} total` : "Not available"}
          </div>
        </button>
      </div>

      {type === "SHARED" && (
        <div className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="font-semibold text-slate-900">
              {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
            </div>
            <div className="mt-1">
              Seats for this departure are still available. You can book one or more seats for the same trip.
            </div>
          </div>
          <Label className="mt-4">Number of seats</Label>
          <div className="mt-2 flex items-center gap-2">
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeats(n)}
                className={`h-10 w-10 rounded-lg border text-sm font-semibold ${
                  seats === n
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pickup address */}
      <div className="mt-6">
        <Label>Pickup/drop address in Hisar</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              ref={addressInputRef}
              value={address}
              onChange={(e) => {
                const nextValue = e.target.value;
                setAddress(nextValue);
                setSelectedCoords(null);
                setPickup(null);
              }}
              placeholder="Type an address in Hisar or use your current location"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
              disabled={checking}
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Use my location
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Type an address, Your entered address will be used for the booking.
        </p>
        {address.trim() && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Address selected</div>
            <div className="mt-1 break-words">{address}</div>
          </div>
        )}
        {pickup && (
          <p
            className={`mt-2 text-sm ${pickup.ok ? "text-brand-700" : "text-red-600"}`}
          >
            {pickup.message}
          </p>
        )}
      </div>

      {/* Passenger details */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Passenger name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
        </div>
      </div>

      {/* Payment mode */}
      <div className="mt-6">
        <Label>Payment</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPayMode("ONLINE")}
            className={`flex items-center gap-2 rounded-xl border p-3 ${
              payMode === "ONLINE" ? "border-brand-600 bg-brand-50" : "border-slate-200"
            }`}
          >
            <CreditCard className="h-5 w-5 text-brand-700" />
            <span className="text-sm font-medium">Pay online</span>
          </button>
          <button
            type="button"
            onClick={() => setPayMode("COD")}
            className={`flex items-center gap-2 rounded-xl border p-3 ${
              payMode === "COD" ? "border-brand-600 bg-brand-50" : "border-slate-200"
            }`}
          >
            <Wallet className="h-5 w-5 text-brand-700" />
            <span className="text-sm font-medium">Cash on pickup</span>
          </button>
        </div>
        {isMockPayment && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Live Razorpay is not configured right now, so online booking uses a local mock payment flow and confirms instantly.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 p-4">
        <span className="text-sm text-slate-600">Total payable</span>
        <span className="text-xl font-bold text-slate-900">{formatINR(amount)}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Button
        className="mt-4 w-full"
        size="lg"
        onClick={submit}
        disabled={submitting || !name || !phone}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {payMode === "COD"
          ? "Confirm booking"
          : isMockPayment
            ? "Complete mock payment & book"
            : `Pay ${formatINR(amount)} & book`}
      </Button>
    </Card>
  );
}
