"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
  }
}

const MSG91_WIDGET_URLS = [
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js",
];

export default function AuthPanel({
  redirectTo,
  onSuccess,
  collectDetails = true,
}: {
  redirectTo?: string;
  onSuccess?: () => void;
  collectDetails?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  function normalizeMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) return digits;
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }

  async function ensureMsg91Widget() {
    if (typeof window === "undefined") {
      throw new Error("MSG91 widget is only available in the browser.");
    }
    if (typeof window.initSendOTP === "function") return;

    await new Promise<void>((resolve, reject) => {
      let index = 0;
      const attempt = () => {
        const script = document.createElement("script");
        script.src = MSG91_WIDGET_URLS[index];
        script.async = true;
        script.onload = () => {
          if (typeof window.initSendOTP === "function") {
            resolve();
            return;
          }
          index += 1;
          if (index < MSG91_WIDGET_URLS.length) {
            attempt();
          } else {
            reject(new Error("MSG91 widget loaded but initSendOTP is unavailable."));
          }
        };
        script.onerror = () => {
          index += 1;
          if (index < MSG91_WIDGET_URLS.length) {
            attempt();
          } else {
            reject(new Error("Could not load the MSG91 OTP widget."));
          }
        };
        document.head.appendChild(script);
      };
      attempt();
    });
  }

  async function createWidgetSession(providerData: unknown) {
    const res = await fetch("/api/otp/widget-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        phone: phone.trim(),
        providerData,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Widget verification failed");
  }

  async function startSmsWidget(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setShowSuccessModal(false);
    setLoading(true);

    try {
      if (!phone.trim()) throw new Error("Mobile number is required.");
      if (collectDetails && !name.trim()) throw new Error("Name is required.");

      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID;
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH;
      if (!widgetId || !tokenAuth) {
        throw new Error("MSG91 widget is not configured. Add NEXT_PUBLIC_MSG91_WIDGET_ID and NEXT_PUBLIC_MSG91_TOKEN_AUTH.");
      }

      await ensureMsg91Widget();

      await new Promise<void>((resolve, reject) => {
        if (typeof window.initSendOTP !== "function") {
          reject(new Error("MSG91 widget did not initialize."));
          return;
        }

        window.initSendOTP({
          widgetId,
          tokenAuth,
          identifier: normalizeMobile(phone),
          exposeMethods: false,
          success: async (data: unknown) => {
            try {
              await createWidgetSession(data);
              resolve();
            } catch (sessionError) {
              reject(sessionError);
            }
          },
          failure: (widgetError: unknown) => {
            const message =
              widgetError && typeof widgetError === "object" && "message" in widgetError
                ? String((widgetError as { message?: unknown }).message || "OTP verification failed.")
                : "OTP verification failed.";
            reject(new Error(message));
          },
        });
      });

      setSuccessMessage("Verification successful! Redirecting…");
      setShowSuccessModal(true);
      window.setTimeout(() => {
        setShowSuccessModal(false);
        if (onSuccess) onSuccess();
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }, 900);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Verification successful
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {successMessage || "You are all set."}
            </p>
          </div>
        </div>
      )}
      <form onSubmit={startSmsWidget} className="space-y-4">
        {collectDetails && (
          <div>
            <Label>Your name</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
        )}
        <div>
          <Label>Mobile number</Label>
          <Input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            inputMode="numeric"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          Verify mobile & continue
        </Button>
      </form>
    </div>
  );
}
