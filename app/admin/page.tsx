import { Clock, MapPin, IndianRupee, Ticket, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatTime12h, formatINR } from "@/lib/utils";
import { confirmBooking, cancelBooking } from "./actions";

export default async function AdminDashboard() {
  const [bookings, confirmedCount, pendingCount, revenueAgg] = await Promise.all([
    prisma.booking.findMany({
      include: { trip: { include: { route: true } }, user: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED" },
    }),
  ]);

  const stats = [
    { label: "Confirmed", value: confirmedCount, icon: CheckCircle2 },
    { label: "Pending", value: pendingCount, icon: Ticket },
    {
      label: "Revenue (confirmed)",
      value: formatINR(revenueAgg._sum.amount ?? 0),
      icon: IndianRupee,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{s.label}</span>
              <s.icon className="h-5 w-5 text-brand-700" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">
        Recent bookings
      </h2>
      {bookings.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-slate-500">
          No bookings yet.
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <MapPin className="h-4 w-4 text-brand-700" />
                    {b.trip.route.origin} → {b.trip.route.destination}
                    <span className="text-xs font-normal text-slate-400">
                      #{b.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>{formatDate(b.trip.date)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime12h(b.trip.departureTime)}
                    </span>
                    <span>
                      {b.type === "PRIVATE"
                        ? "Private"
                        : `${b.seats} seat(s)`}
                    </span>
                    <span>{formatINR(b.amount)}</span>
                    <span>
                      {b.paymentMode === "COD" ? "COD" : "Online"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {b.passengerName} · {b.passengerPhone} ·{" "}
                    <span className="text-slate-400">{b.user.email}</span>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-500">
                    Pickup: {b.pickupAddress} ({b.pickupDistanceKm} km)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === "CONFIRMED" && <Badge color="green">Confirmed</Badge>}
                  {b.status === "PENDING" && <Badge color="amber">Pending</Badge>}
                  {b.status === "CANCELLED" && <Badge color="red">Cancelled</Badge>}
                  {b.status === "PENDING" && (
                    <form action={confirmBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <Button size="sm">Confirm</Button>
                    </form>
                  )}
                  {b.status !== "CANCELLED" && (
                    <form action={cancelBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <Button size="sm" variant="danger">
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
