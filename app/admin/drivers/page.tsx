import { Phone, Mail, Car as CarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { approveDriver, rejectDriver } from "../actions";

export default async function AdminDrivers() {
  const applications = await prisma.driverApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  const pending = applications.filter((a) => a.status === "PENDING");
  const processed = applications.filter((a) => a.status !== "PENDING");

  const AppCard = ({ a }: { a: (typeof applications)[number] }) => (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <CarIcon className="h-4 w-4 text-brand-700" />
            {a.carModel} · {a.plateNumber}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {a.driverName} · {a.seats} seats · {a.city}
            {a.fuelType ? ` · ${a.fuelType}` : ""}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> {a.phone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {a.email}
            </span>
            <span>Fee {a.commissionPct}%</span>
            <span className="text-slate-400">{formatDate(a.createdAt)}</span>
          </div>
          {a.message && (
            <p className="mt-2 text-sm italic text-slate-500">“{a.message}”</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {a.status === "PENDING" && (
            <>
              <form action={approveDriver}>
                <input type="hidden" name="id" value={a.id} />
                <Button size="sm">Approve & add car</Button>
              </form>
              <form action={rejectDriver}>
                <input type="hidden" name="id" value={a.id} />
                <Button size="sm" variant="danger">
                  Reject
                </Button>
              </form>
            </>
          )}
          {a.status === "APPROVED" && <Badge color="green">Approved</Badge>}
          {a.status === "REJECTED" && <Badge color="red">Rejected</Badge>}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Driver applications</h1>
        <p className="text-sm text-slate-500">
          Review drivers who want to list their car. Approving adds their car to
          your fleet automatically.
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No pending applications.
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <AppCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-slate-900">Processed</h2>
          <div className="space-y-3 opacity-80">
            {processed.map((a) => (
              <AppCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
