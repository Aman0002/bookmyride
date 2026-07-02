"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does home pickup work?",
    a: "Enter your address in Hisar while booking. If it's within our service area (10 km of the city center), our driver picks you up right from your doorstep at the scheduled time.",
  },
  {
    q: "What if my address is outside Hisar?",
    a: "For now we only pick up within the Hisar service area. If your address is too far, the booking will not be accepted so you're never charged for a ride we can't fulfil.",
  },
  {
    q: "Can I pay cash instead of online?",
    a: "Yes. At checkout you can choose Cash on Pickup (COD) and pay the driver directly, or pay securely online.",
  },
  {
    q: "What is the difference between shared and private?",
    a: "A shared seat is priced per seat and you travel with other passengers. A private booking reserves the whole car just for you and your group.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes, you can cancel an upcoming ride from your bookings page. See our Refund & Cancellation policy for details.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-2xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium text-slate-900">{f.q}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {open === i && (
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
