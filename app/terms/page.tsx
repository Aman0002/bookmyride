import { BRAND } from "@/lib/constants";

export const metadata = { title: `Terms & Conditions - ${BRAND.name}` };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-slate-500">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. About the service</h2>
          <p>
            {BRAND.name} provides intercity cab booking for fixed routes
            originating from Hisar. By booking a ride you agree to these terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Bookings & pickup</h2>
          <p>
            Rides are offered on scheduled departures. Home pickup is available
            only within our defined Hisar service area. Bookings with a pickup
            address outside this area will not be accepted. Please be ready at
            least 10 minutes before the scheduled departure time.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Fares & payment</h2>
          <p>
            Fares are shown before you confirm. Shared rides are priced per seat
            and private rides reserve the whole vehicle. You may pay online or
            by cash on pickup (COD). For COD, please keep the exact fare ready.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Cancellations</h2>
          <p>
            You may cancel an upcoming booking from your account. Refund
            eligibility for online payments is described in our Refund &
            Cancellation policy.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Driver partners</h2>
          <p>
            Drivers who list their vehicles agree to a platform fee of 7% per
            fare and to our verification process. {BRAND.name} reserves the
            right to approve or reject applications.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Conduct & liability</h2>
          <p>
            We aim to provide safe, comfortable rides. {BRAND.name} is not liable
            for delays caused by traffic, weather, or events beyond our control.
            Passengers are expected to behave respectfully toward drivers and
            fellow passengers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">7. Contact</h2>
          <p>
            Questions about these terms? Reach us at {BRAND.email} or{" "}
            {BRAND.phone}.
          </p>
        </section>
        <p className="text-sm text-slate-400">
          This is a general template and should be reviewed by a legal
          professional before commercial launch.
        </p>
      </div>
    </div>
  );
}
