import Image from "next/image";
import { Wallet, Users, MapPin, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { Reveal, Stagger, StaggerItem, HoverCard } from "@/components/Reveal";
import DriverForm from "@/components/DriverForm";
import { DRIVER_COMMISSION_PCT, BRAND } from "@/lib/constants";

export const metadata = {
  title: `Drive with ${BRAND.name} - Partner with us`,
  description:
    "List your car on Book My Ride and earn on the Hisar routes. Only a 7% platform fee.",
};

export default function PartnerPage() {
  const perks = [
    { icon: Wallet, title: `Keep ${100 - DRIVER_COMMISSION_PCT}%`, desc: `We charge just ${DRIVER_COMMISSION_PCT}% per fare - the rest is yours.` },
    { icon: Users, title: "Steady bookings", desc: "Get riders on popular Hisar routes without chasing customers." },
    { icon: MapPin, title: "You choose", desc: "Drive the routes and timings that suit you." },
    { icon: TrendingUp, title: "Grow with us", desc: "Build ratings and get more visibility as you complete rides." },
  ];

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/baleno.jpg"
            alt="Partner with Book My Ride"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur">
              Partner program
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Turn your car into income
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-200">
              List your car with {BRAND.name}, serve riders across Hisar, and
              keep {100 - DRIVER_COMMISSION_PCT}% of every fare. We only take a{" "}
              {DRIVER_COMMISSION_PCT}% platform fee.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <StaggerItem key={p.title}>
              <HoverCard className="h-full">
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 elevated">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-20">
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Apply to drive</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in your details and our team will review your car before adding
            it to the platform.
          </p>
          <div className="mt-6">
            <DriverForm />
          </div>
        </Card>
      </section>
    </div>
  );
}
