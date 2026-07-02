import { BRAND } from "@/lib/constants";

export const metadata = { title: `Refund & Cancellation - ${BRAND.name}` };

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">
        Refund & Cancellation Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cancelling a ride</h2>
          <p>
            You can cancel any upcoming ride from your bookings page before the
            scheduled departure. Past rides cannot be cancelled.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Refunds (online payments)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cancel more than 12 hours before departure: full refund.</li>
            <li>Cancel 2-12 hours before departure: 50% refund.</li>
            <li>Cancel less than 2 hours before, or no-show: no refund.</li>
          </ul>
          <p className="mt-2">
            Approved refunds are processed to your original payment method
            within 5-7 business days.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cash on pickup (COD)</h2>
          <p>
            No charge applies if you cancel a COD booking before departure.
            Repeated no-shows may affect your ability to use COD.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cancellations by us</h2>
          <p>
            If we cancel a ride (for example, due to unforeseen circumstances),
            you receive a full refund for any online payment.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
          <p>
            Contact us at {BRAND.email} or {BRAND.phone} and we'll assist you.
          </p>
        </section>
        <p className="text-sm text-slate-400">
          These timelines are a suggested default - adjust them to match your
          business before launch.
        </p>
      </div>
    </div>
  );
}
