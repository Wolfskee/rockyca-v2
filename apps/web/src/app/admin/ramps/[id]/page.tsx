"use client";

import { Alert, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RampForm } from "@/components/admin/RampForm";
import { adminGetRamp, ApiError } from "@/lib/api";
import type { LoadingRamp } from "@/lib/types";

export default function AdminEditRampPage() {
  const params = useParams<{ id: string }>();
  const [ramp, setRamp] = useState<LoadingRamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      setError("Invalid ramp ID");
      setLoading(false);
      return;
    }

    adminGetRamp(id)
      .then(setRamp)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load loading ramp",
        ),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/ramps"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Loading Ramps
      </Link>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error || !ramp ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {error || "Loading ramp not found"}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Loading Ramp #{ramp.stockNumber}
          </h1>
          <RampForm initialRamp={ramp} />
        </>
      )}
    </div>
  );
}
