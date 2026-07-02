"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export default function DriverForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/drivers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverName: fd.get("driverName"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          city: fd.get("city"),
          carModel: fd.get("carModel"),
          plateNumber: fd.get("plateNumber"),
          seats: Number(fd.get("seats")),
          fuelType: fd.get("fuelType") || undefined,
          message: fd.get("message") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">
          Application received!
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Thanks for your interest. Our team will review your details and reach
          out to you soon. We've also sent a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Your name</Label>
        <Input name="driverName" required placeholder="Full name" />
      </div>
      <div>
        <Label>Phone</Label>
        <Input name="phone" required inputMode="numeric" placeholder="10-digit mobile" />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required placeholder="you@example.com" />
      </div>
      <div>
        <Label>City</Label>
        <Input name="city" defaultValue="Hisar" required />
      </div>
      <div>
        <Label>Car model</Label>
        <Input name="carModel" required placeholder="e.g. Maruti Baleno" />
      </div>
      <div>
        <Label>Plate number</Label>
        <Input name="plateNumber" required placeholder="HR-39-A-0000" />
      </div>
      <div>
        <Label>Seats (excluding driver)</Label>
        <Input name="seats" type="number" defaultValue={4} min={2} max={15} />
      </div>
      <div>
        <Label>Fuel type</Label>
        <Input name="fuelType" placeholder="e.g. CNG + Petrol" />
      </div>
      <div className="sm:col-span-2">
        <Label>Anything else? (optional)</Label>
        <textarea
          name="message"
          rows={3}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Experience, availability, routes you prefer..."
        />
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit application
        </Button>
        <p className="mt-2 text-center text-xs text-slate-400">
          By applying you agree to our 7% platform fee and Terms & Conditions.
        </p>
      </div>
    </form>
  );
}
