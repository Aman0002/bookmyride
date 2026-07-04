"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, ShieldCheck, SlidersHorizontal, Car as CarIcon, AlertCircle } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { formatINR, formatTimeWindow } from "@/lib/utils";

export type TripDTO = {
  id: string;
  departureTime: string;
  departureEndTime: string;
  sharedSeatsLeft: number;
  sharedCapacity: number;
  canShare: boolean;
  canPrivate: boolean;
  sharedSeatPrice: number;
  privatePrice: number;
  status: string;
  carsTotal: number;
  isExpired: boolean;
};

type TimeFilter = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";

const filters: { key: TimeFilter; label: string; hint: string }[] = [
  { key: "ALL", label: "All day", hint: "" },
  { key: "MORNING", label: "Morning", hint: "before 12 PM" },
  { key: "AFTERNOON", label: "Afternoon", hint: "12 - 5 PM" },
  { key: "EVENING", label: "Evening", hint: "after 5 PM" },
];

function bucketOf(hhmm: string): TimeFilter {
  const h = Number(hhmm.split(":")[0]);
  if (h < 12) return "MORNING";
  if (h < 17) return "AFTERNOON";
  return "EVENING";
}

export default function TripResults({ trips }: { trips: TripDTO[] }) {
  const [filter, setFilter] = useState<TimeFilter>("ALL");

  const counts: Record<TimeFilter, number> = {
    ALL: trips.length,
    MORNING: trips.filter((t) => bucketOf(t.departureTime) === "MORNING").length,
    AFTERNOON: trips.filter((t) => bucketOf(t.departureTime) === "AFTERNOON").length,
    EVENING: trips.filter((t) => bucketOf(t.departureTime) === "EVENING").length,
  };

  const visible = trips.filter(
    (t) => filter === "ALL" || bucketOf(t.departureTime) === filter
  );

  return (
    <div>
      {/* Timing filter */}
      <div className="no-scrollbar mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
        {filters.map((f) => (
          <motion.button
            key={f.key}
            onClick={() => setFilter(f.key)}
            whileTap={{ scale: 0.94 }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-xs ${
                filter === f.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[f.key]}
            </span>
          </motion.button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No rides in this time slot. Try another filter.
        </Card>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visible.map((t, i) => {
              const seatsLeft = t.sharedSeatsLeft;
              const unavailable =
                t.isExpired || t.status === "FULL" || (!t.canShare && !t.canPrivate);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card
                    className={`overflow-hidden p-5 transition-shadow hover:shadow-md ${
                      unavailable ? "opacity-95" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center rounded-2xl bg-brand-50 px-3 py-2 text-brand-800">
                          <Clock className="h-4 w-4" />
                          <span className="mt-1 whitespace-nowrap text-xs font-bold leading-tight">
                            {formatTimeWindow(t.departureTime, t.departureEndTime)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-900">
                              <CarIcon className="h-4 w-4 text-brand-700" /> Pickup window
                            </span>
                            {t.isExpired && <Badge color="red">Departed</Badge>}
                            {!t.isExpired && unavailable && <Badge color="red">Full</Badge>}
                            {!unavailable && <Badge color="green">Available</Badge>}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                            {unavailable ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 font-semibold text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {t.isExpired ? "Departure passed" : "No seats available"}
                              </span>
                            ) : t.canShare ? (
                              <span
                                className={`flex items-center gap-1 ${
                                  seatsLeft <= 2 ? "font-semibold text-amber-600" : ""
                                }`}
                              >
                                <Users className="h-4 w-4" />
                                {`${seatsLeft} seat${seatsLeft > 1 ? "s" : ""} left${
                                  seatsLeft <= 2 ? " - hurry!" : ""
                                }`}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-amber-600">
                                <Users className="h-4 w-4" />
                                Seats full - private car available
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-4 w-4" />
                              Shared seats are pooled for this trip
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-5 sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Shared</div>
                          <div className="text-lg font-extrabold text-brand-700">
                            {formatINR(t.sharedSeatPrice)}
                            <span className="text-xs font-normal text-slate-400">/seat</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            or private {formatINR(t.privatePrice)}
                          </div>
                        </div>
                        {unavailable ? (
                          <Button disabled variant="outline">
                            {t.isExpired ? "Departed" : "Sold out"}
                          </Button>
                        ) : (
                          <Link href={`/book/${t.id}`}>
                            <Button>Book</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
