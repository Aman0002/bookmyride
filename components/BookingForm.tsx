"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Car,
  MapPin,
  CheckCircle2,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { DEFAULT_SEATS } from "@/lib/constants";

type RideType = "SHARED" | "PRIVATE" | "PARCEL";
type PayMode = "COD";

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
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [parcelType, setParcelType] = useState("small");
  const [parcelWeight, setParcelWeight] = useState("1");
  const [parcelDescription, setParcelDescription] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [payMode] = useState<PayMode>("COD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  const amount = type === "PARCEL" ? 200 : type === "PRIVATE" ? privatePrice : sharedPrice * seats;


  async function submit() {
    setError("");
    if (!address.trim()) {
      setError("Please enter a pickup address.");
      return;
    }
    if (type === "PARCEL") {
      if (!deliveryAddress.trim()) {
        setError("Please enter a delivery address.");
        return;
      }
      if (!receiverName.trim() || !receiverPhone.trim()) {
        setError("Please enter receiver details for the parcel.");
        return;
      }
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
          deliveryAddress: type === "PARCEL" ? deliveryAddress : undefined,
          parcelType: type === "PARCEL" ? parcelType : undefined,
          parcelWeightKg: type === "PARCEL" ? Number(parcelWeight) : undefined,
          parcelDescription: type === "PARCEL" ? parcelDescription : undefined,
          receiverName: type === "PARCEL" ? receiverName : undefined,
          receiverPhone: type === "PARCEL" ? receiverPhone : undefined,
          isFragile: type === "PARCEL" ? isFragile : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      if (data.confirmed) {
        setDoneId(data.bookingId);
        return;
      }
      throw new Error("Booking flow is temporarily unavailable.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }


  if (doneId) {
    return (
      <Card className="mt-6 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Booking confirmed!
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Booking ID <b>{doneId.slice(-8).toUpperCase()}</b>. Your ride details are now in{" "}
          <Link href="/account" className="font-medium text-brand-700 underline">
            My bookings
          </Link>{" "}
          and your confirmation email. Please keep cash ready for pickup.
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
      <div className="mt-4 grid gap-3 md:grid-cols-3">
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
        <button
          type="button"
          onClick={() => setType("PARCEL")}
          className={`rounded-xl border p-4 text-left transition ${
            type === "PARCEL"
              ? "border-brand-600 bg-brand-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <MapPin className="h-5 w-5 text-brand-700" />
          <div className="mt-2 font-semibold text-slate-900">Send parcel</div>
          <div className="text-sm text-slate-500">Single parcel delivery · {formatINR(200)}</div>
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

      {type === "PARCEL" && (
        <div className="mt-6 space-y-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="text-sm text-slate-600">
          In Hisar, you can enter a pickup address. For Chandigarh, parcels must be sent/received at ISBT Chandigarh.
        </div>
          <div>
            <Label>Parcel type</Label>
            <select value={parcelType} onChange={(e) => setParcelType(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="small">Small parcel</option>
              <option value="medium">Medium parcel</option>
              <option value="document">Documents</option>
              <option value="fragile">Fragile parcel</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Weight (kg)</Label>
              <Input value={parcelWeight} onChange={(e) => setParcelWeight(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label>Delivery point</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter Hisar address or ISBT Chandigarh" />
            </div>
          </div>
          <div>
            <Label>Parcel description</Label>
            <Input value={parcelDescription} onChange={(e) => setParcelDescription(e.target.value)} placeholder="What is being delivered?" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Receiver name</Label>
              <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            </div>
            <div>
              <Label>Receiver phone</Label>
              <Input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isFragile} onChange={(e) => setIsFragile(e.target.checked)} />
            Mark as fragile
          </label>
        </div>
      )}

      {/* Pickup address */}
      <div className="mt-6">
        <Label>Pickup/drop address in Hisar</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
              }}
              placeholder="Type an address in Hisar"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Type an address in Hisar. Your entered address will be used for the booking.
        </p>
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

      {/* Payment */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
        <div className="flex items-center gap-2 font-medium">
          <Wallet className="h-4 w-4" /> Cash on pickup only
        </div>
        <div className="mt-1">Bookings are currently accepted for cash payment at pickup. Online payment will be available later.</div>
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
        Confirm booking
      </Button>
    </Card>
  );
}
