"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, MapPin, Navigation, CalendarDays } from "lucide-react";
import { Button, Label, Select, Input } from "@/components/ui";

type RouteOption = { origin: string; destination: string };

export default function SearchForm({
  routes,
  defaultFrom,
  defaultTo,
  defaultDate,
  compact = false,
}: {
  routes: RouteOption[];
  defaultFrom?: string;
  defaultTo?: string;
  defaultDate?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  // Sources = places that have at least one route leaving from them.
  const sources = useMemo(
    () => Array.from(new Set(routes.map((r) => r.origin))),
    [routes]
  );

  const [from, setFrom] = useState(defaultFrom || sources[0] || "");
  const destinationsFor = (src: string) =>
    routes.filter((r) => r.origin === src).map((r) => r.destination);

  const [to, setTo] = useState(
    defaultTo || destinationsFor(defaultFrom || sources[0] || "")[0] || ""
  );
  const [date, setDate] = useState(defaultDate || today);
  const [error, setError] = useState("");

  const destinations = destinationsFor(from);

  function onFromChange(value: string) {
    setFrom(value);
    const dests = destinationsFor(value);
    // Keep current destination if still valid, else pick the first.
    if (!dests.includes(to)) setTo(dests[0] || "");
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setError("Please choose a source and destination.");
      return;
    }
    if (from === to) {
      setError("Source and destination can't be the same.");
      return;
    }
    router.push(
      `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
        to
      )}&date=${date}`
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div
        className={`grid gap-3 ${
          compact
            ? "sm:grid-cols-2 lg:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
        }`}
      >
        <div>
          {!compact && (
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-600" /> From
            </Label>
          )}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
            <Select
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="pl-9 font-medium"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          {!compact && (
            <Label className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-brand-600" /> To
            </Label>
          )}
          <div className="relative">
            <Navigation className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
            <Select
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setError("");
              }}
              className="pl-9 font-medium"
            >
              {destinations.length === 0 && <option value="">No routes yet</option>}
              {destinations.map((d) => (
                <option key={d} value={d} disabled={d === from}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          {!compact && (
            <Label className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-brand-600" /> Date
            </Label>
          )}
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
            <Input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 font-medium"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full">
            <Search className="h-4 w-4" /> Search rides
          </Button>
        </div>
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
