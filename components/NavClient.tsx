"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";

type Props = {
  loggedIn: boolean;
  isAdmin: boolean;
  displayName: string | null;
};

const links = [
  { href: "/search", label: "Book a ride" },
  { href: "/partner", label: "Drive with us" },
];

export default function NavClient({ loggedIn, isAdmin, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-brand-50 text-brand-700"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass(l.href)}>
            {l.label}
          </Link>
        ))}
        {loggedIn && (
          <Link href="/account" className={linkClass("/account")}>
            My bookings
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
        )}
        {loggedIn ? (
          <Link
            href="/account"
            className="ml-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800"
          >
            {displayName}
          </Link>
        ) : (
          <Link
            href="/login"
            className="ml-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Log in
          </Link>
        )}
      </nav>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
        aria-label="Menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute inset-x-0 top-16 z-50 border-b border-slate-200 bg-white p-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            {loggedIn && (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                My bookings
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 rounded-lg px-3 py-3 text-base font-medium text-brand-700 hover:bg-brand-50"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
            {loggedIn ? (
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg bg-slate-100 px-3 py-3 text-center text-base font-medium text-slate-800"
              >
                {displayName}
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg bg-brand-700 px-4 py-3 text-center text-base font-semibold text-white"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
