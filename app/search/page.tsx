import { ArrowRight, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureTripsForDate } from "@/lib/trips";
import { Card } from "@/components/ui";
import SearchForm from "@/components/SearchForm";
import TripResults, { type TripDTO } from "@/components/TripResults";
import { formatDate, toDateOnly } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string; routeId?: string }>;
}) {
  const { from, to, date, routeId } = await searchParams;
  const routes = await prisma.route.findMany({
    where: { active: true },
    orderBy: [{ origin: "asc" }, { destination: "asc" }],
  });

  // Resolve the selected route from from/to (preferred) or a legacy routeId.
  let route =
    from && to
      ? routes.find((r) => r.origin === from && r.destination === to)
      : undefined;
  if (!route && routeId) route = routes.find((r) => r.id === routeId);

  const dateStr = date || new Date().toISOString().slice(0, 10);
  const searched = Boolean(from && to) || Boolean(routeId);

  const rawTrips = route
    ? await ensureTripsForDate(route.id, toDateOnly(dateStr))
    : [];

  const trips: TripDTO[] = rawTrips.map((t) => ({
    id: t.id,
    departureTime: t.departureTime,
    seatsTotal: t.seatsTotal,
    seatsBooked: t.seatsBooked,
    sharedSeatPrice: t.sharedSeatPrice,
    privatePrice: t.privatePrice,
    status: t.status,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Find your ride</h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose your route and travel date.
      </p>

      <Card className="mt-4 p-4 sm:p-5">
        <SearchForm
          routes={routes}
          defaultFrom={route?.origin || from}
          defaultTo={route?.destination || to}
          defaultDate={dateStr}
          compact
        />
      </Card>

      {searched && !route && (
        <Card className="mt-8 p-8 text-center text-slate-600">
          We don't have rides on{" "}
          <span className="font-semibold">
            {from} → {to}
          </span>{" "}
          yet. Please pick a different destination.
        </Card>
      )}

      {route && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              {route.origin}
              <ArrowRight className="h-4 w-4 text-brand-600" />
              {route.destination}
            </h2>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" /> {formatDate(dateStr)}
            </span>
          </div>

          {trips.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              No departures scheduled for this date. Try another date.
            </Card>
          ) : (
            <TripResults trips={trips} />
          )}
        </div>
      )}
    </div>
  );
}
