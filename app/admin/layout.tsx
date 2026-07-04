import Link from "next/link";
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Settings,
  UserPlus,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { getCurrentUser, getAdminSession, getSession } from "@/lib/session";
import { isAdminPhone } from "@/lib/admin";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/schedules", label: "Schedules & Trips", icon: CalendarClock },
  { href: "/admin/fleet", label: "Routes & Cars", icon: Car },
  { href: "/admin/drivers", label: "Driver applications", icon: UserPlus },
  { href: "/admin/settings", label: "Service area", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = await getCurrentUser();
  const adminSession = await getAdminSession();
  const isAdmin = Boolean(
    session?.isAdmin ||
      user?.isAdmin ||
      adminSession ||
      isAdminPhone(session?.phone || user?.phone)
  );

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center px-4 py-20">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Only approved admin phone numbers can open the admin area. Please sign in with an authorized number to continue.
          </p>
          <Link
            href="/login?next=/admin"
            className="mt-6 inline-flex rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Mobile top nav */}
      <div className="-mx-4 mb-4 overflow-x-auto border-b border-slate-200 px-4 pb-2 sm:hidden">
        <div className="flex gap-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              prefetch={false}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 sm:block">
          <div className="sticky top-20 space-y-1">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </div>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                prefetch={false}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
            <form action="/api/admin/logout" method="POST" className="mt-3 px-3">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
