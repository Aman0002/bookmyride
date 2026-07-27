import { Clock, MapPin, IndianRupee, Ticket, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate, formatTime12h, formatINR, getIndiaDateString, formatDateTimeIST, formatTripDateTimeIST, parseTripDateTimeIST } from "@/lib/utils";
import { confirmBooking, cancelBooking } from "./actions";

export default async function AdminDashboard() {
  const bookings = await prisma.booking.findMany({
    include: { trip: { include: { route: true } }, user: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const getTripDateTime = (trip: { date: Date | string; departureTime: string }) => {
    return parseTripDateTimeIST(trip.date, trip.departureTime);
  };

  const upcomingBookings = bookings.filter((booking) => getTripDateTime(booking.trip) >= now);
  const confirmedCount = upcomingBookings.filter((booking) => booking.status === "CONFIRMED").length;
  const pendingCount = upcomingBookings.filter((booking) => booking.status === "PENDING").length;
  const confirmedRevenue = upcomingBookings
    .filter((booking) => booking.status === "CONFIRMED")
    .reduce((sum, booking) => sum + booking.amount, 0);

  const stats = [
    { label: "Confirmed", value: confirmedCount, icon: CheckCircle2 },
    { label: "Pending", value: pendingCount, icon: Ticket },
    {
      label: "Revenue (confirmed)",
      value: formatINR(confirmedRevenue),
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
        Upcoming bookings
      </h2>
      {upcomingBookings.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-slate-500">
          No bookings yet.
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {upcomingBookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                    <MapPin className="h-4 w-4 text-brand-700" />
                    <span>
                      {b.trip.route.origin} → {b.trip.route.destination}
                    </span>
                    <span className="text-xs font-normal text-slate-400">
                      #{b.id.slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTripDateTimeIST(b.trip.date, b.trip.departureTime)}
                    </span>
                    <span>{b.type === "PRIVATE" ? "Private" : `${b.seats} seat(s)`}</span>
                    <span>{formatINR(b.amount)}</span>
                    <span>{b.paymentMode === "COD" ? "COD" : "Online"}</span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <div className="font-medium text-slate-700">Passenger</div>
                      <div>{b.passengerName || "—"}</div>
                      <div>{b.passengerPhone || "—"}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-700">Booking info</div>
                      <div>Booked: {formatDateTimeIST(b.createdAt)}</div>
                      <div>User: {b.user.name || "—"}</div>
                      <div>Phone: {b.user.phone || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Pickup address
                    </div>
                    <div className="mt-1 break-words text-sm text-slate-700">
                      {b.pickupAddress || "—"}
                    </div>
                    {b.pickupDistanceKm != null && (
                      <div className="mt-1 text-xs text-slate-500">
                        Distance: {b.pickupDistanceKm} km
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
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
