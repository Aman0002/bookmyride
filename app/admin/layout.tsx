import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  Settings,
  UserPlus,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";

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
  const admin = await requireAdmin();
  if (!admin) redirect("/login?next=/admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Mobile top nav */}
      <div className="-mx-4 mb-4 overflow-x-auto border-b border-slate-200 px-4 pb-2 sm:hidden">
        <div className="flex gap-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
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
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
