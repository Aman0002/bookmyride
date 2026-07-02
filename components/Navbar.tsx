import Link from "next/link";
import { Car } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { BRAND } from "@/lib/constants";
import NavClient from "./NavClient";

export default async function Navbar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {BRAND.name}
          </span>
        </Link>

        <NavClient
          loggedIn={!!user}
          isAdmin={!!user?.isAdmin}
          displayName={user ? user.name || user.email.split("@")[0] : null}
        />
      </div>
    </header>
  );
}
