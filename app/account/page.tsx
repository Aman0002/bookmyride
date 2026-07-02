import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, MapPin, Wallet, CreditCard, Car as CarIcon, Phone, User, Fuel } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Badge, Button, Card } from "@/components/ui";
import LogoutButton from "@/components/LogoutButton";
import BookingActions from "@/components/BookingActions";
import { formatDate, formatTime12h, formatINR } from "@/lib/utils";

function statusBadge(status: string) {
  if (status === "CONFIRMED") return <Badge color="green">Confirmed</Badge>;
  if (status === "PENDING") return <Badge color="amber">Payment pending</Badge>;
  return <Badge color="red">Cancelled</Badge>;
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { trip: { include: { route: true, car: true } }, review: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = bookings.filter(
    (b) => b.trip.date >= now && b.status !== "CANCELLED"
  );
  const past = bookings.filter(
    (b) => b.trip.date < now || b.status === "CANCELLED"
  );

  const BookingCard = ({ b }: { b: (typeof bookings)[number] }) => (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <MapPin className="h-4 w-4 text-brand-700" />
            {b.trip.route.origin} → {b.trip.route.destination}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>{formatDate(b.trip.date)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatTime12h(b.trip.departureTime)}
            </span>
            <span>
              {b.type === "PRIVATE"
                ? "Private car"
                : `${b.seats} shared seat${b.seats > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-600">Pickup:</span>{" "}
            {b.pickupAddress}
          </div>
        </div>
        <div className="text-right">
          {statusBadge(b.status)}
          <div className="mt-2 text-lg font-bold text-slate-900">
            {formatINR(b.amount)}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
            {b.paymentMode === "COD" ? (
              <>
                <Wallet className="h-3.5 w-3.5" /> Cash on pickup
              </>
            ) : (
              <>
                <CreditCard className="h-3.5 w-3.5" /> Paid online
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            #{b.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>
      {b.status === "CONFIRMED" && b.trip.car && (
        <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Your driver & car
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-700">
            <span className="flex items-center gap-1.5">
              <CarIcon className="h-4 w-4 text-brand-600" />
              {b.trip.car.name}
              {b.trip.car.plateNumber ? ` · ${b.trip.car.plateNumber}` : ""}
            </span>
            {b.trip.car.fuelType && (
              <span className="flex items-center gap-1.5">
                <Fuel className="h-4 w-4 text-brand-600" />
                {b.trip.car.fuelType}
              </span>
            )}
            {b.trip.car.driverName && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-brand-600" />
                {b.trip.car.driverName}
              </span>
            )}
            {b.trip.car.driverPhone && (
              <a
                href={`tel:${b.trip.car.driverPhone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
              >
                <Phone className="h-4 w-4" />
                {b.trip.car.driverPhone}
              </a>
            )}
          </div>
        </div>
      )}
      {(b.trip.date >= now && b.status !== "CANCELLED") ||
      (b.trip.date < now && b.status === "CONFIRMED") ||
      b.review ? (
        <BookingActions
          bookingId={b.id}
          canCancel={b.trip.date >= now && b.status !== "CANCELLED"}
          canRate={b.trip.date < now && b.status === "CONFIRMED" && !b.review}
          existingRating={b.review?.rating ?? null}
          existingComment={b.review?.comment ?? null}
        />
      ) : null}
    </Card>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
          <p className="text-sm text-slate-500">
            {user.name ? `${user.name} · ` : ""}
            {user.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      {bookings.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-slate-600">You have no bookings yet.</p>
          <Link href="/search" className="mt-4 inline-block">
            <Button>Book your first ride</Button>
          </Link>
        </Card>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming rides.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Past & cancelled ({past.length})
              </h2>
              <div className="space-y-3 opacity-80">
                {past.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
