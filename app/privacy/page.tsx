import { BRAND } from "@/lib/constants";

export const metadata = { title: `Privacy Policy - ${BRAND.name}` };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What we collect</h2>
          <p>
            We collect your name, email, phone number, and pickup address to
            process and fulfil your bookings, and payment references for online
            transactions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">How we use it</h2>
          <p>
            Your information is used to confirm rides, contact you about your
            trip, arrange pickup, and improve our service. We send booking
            confirmations and verification codes to your email.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Sharing</h2>
          <p>
            We share only the details necessary for your ride (such as pickup
            location and contact number) with the assigned driver. We do not
            sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
          <p>
            Online payments are processed by our payment partner. We do not
            store your card or UPI credentials on our servers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your choices</h2>
          <p>
            You can request access to or deletion of your data by contacting us
            at {BRAND.email}.
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
