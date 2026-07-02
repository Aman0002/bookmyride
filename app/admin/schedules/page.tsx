import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { WEEKDAYS } from "@/lib/constants";
import { formatDate, formatTime12h, formatINR } from "@/lib/utils";
import {
  addSchedule,
  toggleSchedule,
  deleteSchedule,
  generateTrips,
} from "../actions";

export default async function AdminSchedules() {
  const routes = await prisma.route.findMany({ orderBy: { destination: "asc" } });
  const schedules = await prisma.tripSchedule.findMany({
    include: { route: true },
    orderBy: [{ routeId: "asc" }, { departureTime: "asc" }],
  });

  const today = new Date();
  const upcomingTrips = await prisma.trip.findMany({
    where: { date: { gte: new Date(today.toDateString()) } },
    include: { route: true, bookings: { where: { status: { not: "CANCELLED" } } } },
    orderBy: [{ date: "asc" }, { departureTime: "asc" }],
    take: 25,
  });

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schedules & Trips</h1>
        <p className="text-sm text-slate-500">
          Define recurring departure times per route, then generate concrete
          trips for the dates you want bookable.
        </p>
      </div>

      {/* Add schedule */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900">Add a schedule</h2>
        <form action={addSchedule} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Route</Label>
            <Select name="routeId" required>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.origin} → {r.destination}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Departure time</Label>
            <Input type="time" name="departureTime" required defaultValue="06:00" />
          </div>
          <div>
            <Label>Shared price (₹/seat)</Label>
            <Input type="number" name="sharedSeatPrice" defaultValue={500} />
          </div>
          <div>
            <Label>Private price (₹)</Label>
            <Input type="number" name="privatePrice" defaultValue={4000} />
          </div>
          <div>
            <Label>Seats per trip</Label>
            <Input type="number" name="seatsPerTrip" defaultValue={6} />
          </div>
          <div>
            <Label>Days of week</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {WEEKDAYS.map((d, i) => (
                <label
                  key={d}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  <input type="checkbox" name="days" value={i} defaultChecked />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Add schedule</Button>
          </div>
        </form>
      </Card>

      {/* Existing schedules */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Schedules</h2>
        <div className="space-y-2">
          {schedules.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-slate-900">
                  {s.route.origin} → {s.route.destination} at{" "}
                  {formatTime12h(s.departureTime)}
                </div>
                <div className="text-sm text-slate-500">
                  {formatINR(s.sharedSeatPrice)}/seat · {formatINR(s.privatePrice)}{" "}
                  private · {s.seatsPerTrip} seats ·{" "}
                  {s.daysOfWeek
                    .split(",")
                    .map((d) => WEEKDAYS[Number(d)])
                    .join(", ")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.active ? (
                  <Badge color="green">Active</Badge>
                ) : (
                  <Badge>Paused</Badge>
                )}
                <form action={toggleSchedule}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button size="sm" variant="outline">
                    {s.active ? "Pause" : "Activate"}
                  </Button>
                </form>
                <form action={deleteSchedule}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button size="sm" variant="danger">
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
          {schedules.length === 0 && (
            <p className="text-sm text-slate-500">No schedules yet.</p>
          )}
        </div>
      </div>

      {/* Generate trips */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900">Generate trips</h2>
        <p className="text-sm text-slate-500">
          Create bookable departures for a date range from active schedules.
          (Trips are also auto-created when a customer searches a date.)
        </p>
        <form
          action={generateTrips}
          className="mt-4 grid gap-4 sm:grid-cols-4 sm:items-end"
        >
          <div className="sm:col-span-2">
            <Label>Route</Label>
            <Select name="routeId" defaultValue="ALL">
              <option value="ALL">All routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.origin} → {r.destination}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>From</Label>
            <Input type="date" name="from" defaultValue={todayStr} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" name="to" defaultValue={todayStr} />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit">Generate</Button>
          </div>
        </form>
      </Card>

      {/* Upcoming trips */}
      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Upcoming trips</h2>
        <div className="space-y-2">
          {upcomingTrips.map((t) => (
            <Card key={t.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-slate-900">
                  {t.route.origin} → {t.route.destination}
                </div>
                <div className="text-sm text-slate-500">
                  {formatDate(t.date)} · {formatTime12h(t.departureTime)} ·{" "}
                  {t.seatsBooked}/{t.seatsTotal} seats
                </div>
              </div>
              {t.status === "OPEN" && <Badge color="green">Open</Badge>}
              {t.status === "FULL" && <Badge color="red">Full</Badge>}
              {t.status === "PRIVATE_BOOKED" && (
                <Badge color="amber">Private</Badge>
              )}
            </Card>
          ))}
          {upcomingTrips.length === 0 && (
            <p className="text-sm text-slate-500">
              No upcoming trips generated yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
