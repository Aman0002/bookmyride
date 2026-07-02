import Link from "next/link";
import { Car, Phone, Mail } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function Footer() {
  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Company",
      links: [
        { href: "/partner", label: "Drive with us" },
        { href: "/faq", label: "FAQ" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/refunds", label: "Refund & Cancellation" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
                <Car className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {BRAND.name}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{BRAND.tagline}</p>
            <p className="mt-3 text-sm text-slate-500">
              Hisar → Chandigarh · Peeragarhi · Delhi IGI Airport
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-slate-900">{c.title}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-500 hover:text-brand-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Get in touch</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {BRAND.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {BRAND.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
