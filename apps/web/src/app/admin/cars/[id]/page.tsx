"use client";

import { Alert, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CarForm } from "@/components/admin/CarForm";
import { adminGetCar, ApiError } from "@/lib/api";
import type { Car } from "@/lib/types";

export default function AdminEditCarPage() {
  const params = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      setError("Invalid vehicle ID");
      setLoading(false);
      return;
    }

    adminGetCar(id)
      .then(setCar)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load vehicle"),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/cars"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vehicles
      </Link>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : error || !car ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error || "Vehicle not found"}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-900">
            Edit: {car.year} {car.make} {car.name}
          </h1>
          <CarForm initialCar={car} />
        </>
      )}
    </div>
  );
}
