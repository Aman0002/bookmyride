"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import Stars from "@/components/Stars";

export default function BookingActions({
  bookingId,
  canCancel,
  canRate,
  existingRating,
  existingComment,
}: {
  bookingId: string;
  canCancel: boolean;
  canRate: boolean;
  existingRating?: number | null;
  existingComment?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [rateOpen, setRateOpen] = useState(false);

  async function cancel() {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRating() {
    if (rating < 1) {
      setError("Please select a rating.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit rating");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (existingRating) {
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">Your rating:</span>
        <Stars value={existingRating} />
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {canRate && !rateOpen && (
        <Button size="sm" variant="outline" onClick={() => setRateOpen(true)}>
          <Star className="h-4 w-4" /> Rate your ride
        </Button>
      )}

      {canRate && rateOpen && (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
              >
                <Star
                  className={`h-7 w-7 ${
                    n <= (hover || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Tell us how your ride was (optional)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submitRating} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit rating
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRateOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          onClick={cancel}
          disabled={busy}
        >
          Cancel booking
        </Button>
      )}
    </div>
  );
}
