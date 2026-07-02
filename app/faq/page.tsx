import Faq from "@/components/Faq";
import { BRAND } from "@/lib/constants";

export const metadata = { title: `FAQ - ${BRAND.name}` };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-slate-900">
        Frequently asked questions
      </h1>
      <p className="mt-2 text-center text-slate-500">
        Everything you need to know about booking with {BRAND.name}.
      </p>
      <div className="mt-8">
        <Faq />
      </div>
    </div>
  );
}
