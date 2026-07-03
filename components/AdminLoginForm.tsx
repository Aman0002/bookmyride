"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export default function AdminLoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("adminbride");
  const [password, setPassword] = useState("adminbride");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Admin login failed");
      router.push(redirectTo || "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Username</Label>
        <Input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="adminbride"
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="adminbride"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Sign in
      </Button>
    </form>
  );
}
