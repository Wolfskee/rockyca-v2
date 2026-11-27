"use client";

import { Alert, Button, Chip, Spinner } from "@heroui/react";
import { Check, MailOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { adminListInquiries, adminMarkInquiryRead, ApiError } from "@/lib/api";
import type { ContactInquiry } from "@/lib/types";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListInquiries(1);
      setInquiries(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load inquiries",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleRead(item: ContactInquiry) {
    try {
      const updated = await adminMarkInquiryRead(item.id, !item.isRead);
      setInquiries((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i)),
      );
      setUnreadCount((prev) => prev + (updated.isRead ? -1 : 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Inquiries
          </h1>
          <p className="text-sm text-slate-500">
            {unreadCount} unread &bull; All submissions passed Turnstile,
            honeypot, rate-limit, and spam checks.
          </p>
        </div>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
          No customer inquiries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-5 shadow-xs ${
                item.isRead
                  ? "border-slate-200 bg-white"
                  : "border-blue-200 bg-blue-50/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {item.subject}
                    </h2>
                    <Chip
                      size="sm"
                      color={item.isRead ? "default" : "accent"}
                    >
                      {item.isRead ? "Read" : "New"}
                    </Chip>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    <strong>{item.name}</strong> &bull;{" "}
                    <a
                      href={`mailto:${item.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.email}
                    </a>
                    {item.phone ? ` • ${item.phone}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => void toggleRead(item)}
                >
                  {item.isRead ? (
                    <>
                      <MailOpen className="h-3.5 w-3.5" />
                      Mark Unread
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Mark Read
                    </>
                  )}
                </Button>
              </div>

              <p className="mt-4 whitespace-pre-line rounded-lg bg-white/80 p-3.5 text-sm text-slate-700 border border-slate-200/70">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
