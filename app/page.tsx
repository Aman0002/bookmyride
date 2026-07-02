import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Car,
  ShieldCheck,
  Wallet,
  MapPin,
  Clock,
  ArrowRight,
  Fuel,
  Users,
  BadgeCheck,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import SearchForm from "@/components/SearchForm";
import { Reveal, Stagger, StaggerItem, MountFade, HoverCard, Float } from "@/components/Reveal";
import Stars from "@/components/Stars";
import Faq from "@/components/Faq";
import { formatINR } from "@/lib/utils";
import { DEFAULT_PRIVATE_PRICE, DEFAULT_SHARED_PRICE } from "@/lib/constants";

function routeImage(origin: string, destination: string) {
  const key = (origin === "Hisar" ? destination : origin).toLowerCase();
  if (key.includes("chandigarh")) return "/images/route-chandigarh.jpg";
  if (key.includes("igi") || key.includes("airport")) return "/images/route-igi.jpg";
  if (key.includes("delhi") || key.includes("peeragarhi")) return "/images/route-delhi.jpg";
  return "/images/route-delhi.jpg";
}

export default async function HomePage() {
  const [routes, reviews, ratingAgg, confirmedCount] = await Promise.all([
    prisma.route.findMany({
      where: { active: true, origin: "Hisar" },
      orderBy: { destination: "asc" },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true },
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
  ]);

  const searchRoutes = await prisma.route.findMany({
    where: { active: true },
    orderBy: { destination: "asc" },
  });

  const avgRating = ratingAgg._avg.rating ?? 0;
  const reviewCount = ratingAgg._count;

  const steps = [
    { icon: MapPin, title: "Pick route & time", desc: "Choose from our fixed daily departures, both ways." },
    { icon: Home, title: "Home pickup", desc: "Enter your Hisar address - we come to your door." },
    { icon: Car, title: "Ride comfortably", desc: "Private Baleno or a shared seat, your choice." },
  ];

  const features = [
    { icon: Home, title: "Doorstep pickup", desc: "We pick you up from home, anywhere within Hisar." },
    { icon: Wallet, title: "Pay your way", desc: "Pay online securely or choose cash on pickup (COD)." },
    { icon: ShieldCheck, title: "Verified booking", desc: "Email OTP confirmation and instant ride details." },
    { icon: Clock, title: "Fixed schedules", desc: "Reliable departure times you can plan around." },
  ];

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero.jpg"
            alt="Book My Ride picking up a family from home"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/30 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pb-24 sm:pt-24">
          <div className="max-w-2xl">
            <MountFade>
              <Float className="inline-block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm ring-1 ring-brand-100 backdrop-blur">
                  <Home className="h-3.5 w-3.5" /> We pick you up from home
                </span>
              </Float>
            </MountFade>
            <MountFade delay={0.1}>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
                Rides from Hisar,
                <span className="brand-gradient-text animate-gradient"> done right.</span>
              </h1>
            </MountFade>
            <MountFade delay={0.2}>
              <p className="mt-4 max-w-xl text-base text-slate-700 sm:text-lg">
                Comfortable Maruti Baleno cabs to Chandigarh, Delhi Peeragarhi and
                IGI Airport - and back. Private car {formatINR(DEFAULT_PRIVATE_PRICE)} or
                shared seat {formatINR(DEFAULT_SHARED_PRICE)}. Doorstep pickup, online or cash.
              </p>
            </MountFade>
          </div>

          <MountFade delay={0.32}>
            <Card className="glass mt-8 max-w-3xl p-4 elevated-lg sm:p-6">
              <SearchForm routes={searchRoutes} />
            </Card>
          </MountFade>

          {/* floating stat pills */}
          <MountFade delay={0.44}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 shadow-sm ring-1 ring-slate-100 backdrop-blur">
                <Stars value={avgRating || 5} size={16} />
                <span className="text-sm font-bold text-slate-900">
                  {avgRating ? avgRating.toFixed(1) : "New"}
                </span>
                <span className="text-sm text-slate-500">
                  {reviewCount > 0 ? `(${reviewCount})` : "rated"}
                </span>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100 backdrop-blur">
                <span className="font-bold text-slate-900">{confirmedCount}+</span> rides booked
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100 backdrop-blur">
                <span className="font-bold text-slate-900">3</span> routes · Hisar pickup
              </div>
            </div>
          </MountFade>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="mx-auto max-w-6xl px-4 section-py">
        <Reveal>
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-center text-slate-600">Three easy steps from home to destination.</p>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <HoverCard className="h-full">
                <div className="relative h-full rounded-3xl border border-slate-200 bg-white p-7 elevated">
                  <span className="absolute -top-3.5 left-7 grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white shadow-md">
                    {i + 1}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------- ROUTES ---------------- */}
      <section className="mesh-bg">
        <div className="mx-auto max-w-6xl px-4 section-py">
          <Reveal>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Popular routes</h2>
            <p className="mt-1 text-slate-600">Fixed daily departures from Hisar - and return trips too.</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((r) => (
              <StaggerItem key={r.id}>
                <Link
                  href={`/search?from=${encodeURIComponent(r.origin)}&to=${encodeURIComponent(r.destination)}`}
                >
                  <HoverCard className="h-full">
                    <div className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white elevated">
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={routeImage(r.origin, r.destination)}
                          alt={r.destination}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="img-zoom object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                            <MapPin className="h-3.5 w-3.5" /> {r.origin}
                          </div>
                          <h3 className="text-xl font-bold drop-shadow">{r.destination}</h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-5">
                        <span className="text-sm text-slate-500">
                          From{" "}
                          <span className="font-bold text-slate-900">
                            {formatINR(DEFAULT_SHARED_PRICE)}
                          </span>
                          /seat
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-brand-700">
                          Book <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </HoverCard>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------------- BALENO FEATURE STRIP ---------------- */}
      <section className="mx-auto max-w-6xl px-4 section-py">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl elevated-lg">
              <Image
                src="/images/baleno.jpg"
                alt="Maruti Baleno"
                width={900}
                height={600}
                className="h-auto w-full object-cover"
              />
              <Float className="absolute right-4 top-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-800 shadow-md backdrop-blur">
                  <Fuel className="h-3.5 w-3.5" /> CNG + Petrol
                </span>
              </Float>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                Our fleet
              </span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Travel in a comfortable Maruti Baleno
              </h2>
              <p className="mt-3 text-slate-600">
                Clean, air-conditioned hatchbacks driven by verified drivers. Every
                car runs on economical CNG + Petrol, with 4 comfortable passenger
                seats (the driver takes one).
              </p>
            </Reveal>
            <Stagger className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, title: "4 seats", desc: "Share or book the whole car." },
                { icon: Fuel, title: "CNG + Petrol", desc: "Economical and eco-friendly." },
                { icon: BadgeCheck, title: "Verified drivers", desc: "Reviewed before every route." },
                { icon: ShieldCheck, title: "Details on confirm", desc: "Driver & car shown after booking." },
              ].map((f) => (
                <StaggerItem key={f.title}>
                  <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{f.title}</div>
                      <div className="text-sm text-slate-600">{f.desc}</div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ---------------- DOORSTEP PICKUP ---------------- */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 section-py lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-300">
                Doorstep service
              </span>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                We come to your door in Hisar
              </h2>
              <p className="mt-3 text-slate-300">
                No auto-rickshaw to the pickup point. Enter your home address and our
                driver arrives at your gate - anywhere within 10 km of Hisar.
              </p>
            </Reveal>
            <Stagger className="mt-6 space-y-3">
              {[
                "Free home pickup within Hisar city",
                "Pay online or with cash on pickup",
                "Instant email confirmation with driver details",
              ].map((t) => (
                <StaggerItem key={t}>
                  <div className="flex items-center gap-3 text-slate-200">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-brand-300" />
                    <span>{t}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl elevated-lg">
              <Image
                src="/images/pickup.jpg"
                alt="Doorstep pickup service"
                width={900}
                height={600}
                className="h-auto w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="mx-auto max-w-6xl px-4 section-py">
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <HoverCard className="h-full">
                <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 elevated">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      {reviews.length > 0 && (
        <section className="mesh-bg">
          <div className="mx-auto max-w-6xl px-4 section-py">
            <Reveal>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                What our riders say
              </h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((rev) => (
                <StaggerItem key={rev.id}>
                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 elevated">
                    <Star className="h-6 w-6 text-brand-200" fill="currentColor" />
                    <Stars value={rev.rating} />
                    <p className="mt-3 text-sm text-slate-700">
                      {rev.comment || "Great ride experience!"}
                    </p>
                    <div className="mt-4 text-sm font-semibold text-slate-900">
                      {rev.user.name || "Verified rider"}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ---------------- DRIVER CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 section-py">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-white elevated-lg sm:px-12">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-accent-500/20 blur-2xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-brand-100">
                  <Car className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Own a car?
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Drive with Book My Ride
                </h2>
                <p className="mt-2 text-brand-50">
                  List your car, get bookings from Hisar, and keep 93% of every
                  fare - we charge just a 7% platform fee. Apply in 2 minutes.
                </p>
              </div>
              <Link href="/partner">
                <span className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-800 transition hover:bg-brand-50">
                  Become a partner <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal>
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-8">
          <Faq />
        </div>
      </section>
    </div>
  );
}
