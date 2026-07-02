import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui";
import { BRAND } from "@/lib/constants";

export const metadata = { title: `Contact - ${BRAND.name}` };

export default function ContactPage() {
  const items = [
    { icon: Phone, label: "Call us", value: BRAND.phone },
    { icon: Mail, label: "Email", value: BRAND.email },
    { icon: MapPin, label: "Base", value: "Hisar, Haryana" },
    { icon: Clock, label: "Hours", value: "Every day, 5 AM - 10 PM" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Contact us</h1>
      <p className="mt-2 text-slate-500">
        We're happy to help with bookings, changes, or partner enquiries.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Card key={i.label} className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <i.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm text-slate-500">{i.label}</div>
              <div className="font-semibold text-slate-900">{i.value}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
