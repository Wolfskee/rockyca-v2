"use client";

import { Alert, Button, Card } from "@heroui/react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminLogin, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminLogin(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-md">
        <Card.Header className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <Card.Title className="text-2xl font-bold text-slate-900">
            Rocky Trading Admin
          </Card.Title>
          <Card.Description className="text-sm text-slate-500">
            Sign in to manage vehicles, loading ramps, and inquiries.
          </Card.Description>
        </Card.Header>

        <Card.Content className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isDisabled={submitting}
              className="h-11 bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
