import { redirect } from "next/navigation";
import { Car } from "lucide-react";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui";
import AuthPanel from "@/components/AuthPanel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect(next || "/account");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 text-white">
        <Car className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Log in to Book My Ride
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        We use a one-time email code - no passwords to remember.
      </p>
      <Card className="mt-8 w-full p-6">
        <AuthPanel redirectTo={next || "/account"} collectDetails={false} />
      </Card>
    </div>
  );
}
