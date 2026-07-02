import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, ArrowLeft, ShieldCheck, Wallet, Home } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui";
import AuthPanel from "@/components/AuthPanel";
import BookingForm from "@/components/BookingForm";
import { formatDate, formatTime12h, formatINR, toDateInput } from "@/lib/utils";

export default async function BookPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { route: true },
  });
  if (!trip) notFound();

  const user = await getCurrentUser();
  const seatsLeft = trip.seatsTotal - trip.seatsBooked;
  const unavailable = trip.status === "FULL" || trip.status === "PRIVATE_BOOKED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/search?from=${encodeURIComponent(trip.route.origin)}&to=${encodeURIComponent(trip.route.destination)}&date=${toDateInput(trip.date)}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <Card className="mt-4 p-6">
        <div className="flex items-center gap-2 text-brand-700">
          <MapPin className="h-5 w-5" />
          <span className="font-semibold">
            {trip.route.origin} → {trip.route.destination}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>{formatDate(trip.date)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {formatTime12h(trip.departureTime)}
          </span>
          <span>Shared {formatINR(trip.sharedSeatPrice)}/seat</span>
          <span>Private {formatINR(trip.privatePrice)}</span>
        </div>
      </Card>

      {/* Trust badges */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Home, label: "Home pickup" },
          { icon: Wallet, label: "Online or cash" },
          { icon: ShieldCheck, label: "OTP verified" },
        ].map((b) => (
          <div
            key={b.label}
            className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-600"
          >
            <b.icon className="h-5 w-5 text-brand-700" />
            {b.label}
          </div>
        ))}
      </div>

      {unavailable ? (
        <Card className="mt-6 p-8 text-center text-slate-600">
          Sorry, this departure is no longer available. Please choose another.
        </Card>
      ) : !user ? (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Verify to continue
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your details and confirm the email code to book your ride.
          </p>
          <div className="mt-4">
            <AuthPanel collectDetails />
          </div>
        </Card>
      ) : (
        <BookingForm
          tripId={trip.id}
          seatsLeft={seatsLeft}
          sharedPrice={trip.sharedSeatPrice}
          privatePrice={trip.privatePrice}
          defaultName={user.name ?? ""}
          defaultPhone={user.phone ?? ""}
        />
      )}
    </div>
  );
}
