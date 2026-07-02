"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Ticket, LogIn } from "lucide-react";

export default function MobileTabBar({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  // Hide inside the admin area (it has its own layout).
  if (pathname?.startsWith("/admin")) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    loggedIn
      ? { href: "/account", label: "My rides", icon: Ticket }
      : { href: "/login", label: "Log in", icon: LogIn },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active ? "text-brand-700" : "text-slate-500"
              }`}
            >
              <t.icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
