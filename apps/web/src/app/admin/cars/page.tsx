"use client";

import { Alert, Button, Chip, Modal, Spinner } from "@heroui/react";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteCar,
  adminListCars,
  adminUpdateCar,
  ApiError,
} from "@/lib/api";
import { CAR_TYPE_LABELS, formatCurrency } from "@/lib/format";
import type { Car } from "@/lib/types";

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [soldOutTarget, setSoldOutTarget] = useState<Car | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListCars({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: search || undefined,
      });
      setCars(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmMarkSoldOut() {
    if (!soldOutTarget) return;
    setBusy(true);
    try {
      await adminUpdateCar(soldOutTarget.id, { status: "sold_out" });
      setSoldOutTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(car: Car) {
    if (
      !window.confirm(
        `Permanently delete "${car.year} ${car.make} ${car.name}" and all its S3 files?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adminDeleteCar(car.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete vehicle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicles</h1>
          <p className="text-sm text-slate-500">
            Sold-out vehicles are automatically removed from the website and
            have their S3 images &amp; Carfax PDFs deleted.
          </p>
        </div>
        <Link
          href="/admin/cars/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make, model, stock #, VIN..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="sold_out">Sold Out (Archived)</option>
        </select>
        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="sedan">Sedan</option>
          <option value="suv">SUV</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : cars.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No vehicles found.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Stock # / VIN</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {car.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={car.primaryImage.url}
                        alt={car.name}
                        className="h-12 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
                        None
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {car.year} {car.make} {car.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {car.type ? CAR_TYPE_LABELS[car.type] : "Unspecified"} &bull;{" "}
                      {car.images.length} images
                      {car.carfaxUrl ? " • Carfax PDF" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    <div>#{car.stockNumber}</div>
                    <div className="text-slate-400">{car.vin}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(car.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Chip
                      size="sm"
                      color={car.status === "in_stock" ? "success" : "danger"}
                    >
                      {car.status === "in_stock" ? "In Stock" : "Sold Out"}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {car.status === "in_stock" && (
                        <Button
                          size="sm"
                          variant="danger-soft"
                          isDisabled={busy}
                          onPress={() => setSoldOutTarget(car)}
                        >
                          Mark Sold Out
                        </Button>
                      )}
                      <Link
                        href={`/admin/cars/${car.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={busy}
                        onPress={() => void handleDelete(car)}
                        aria-label={`Delete ${car.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={Boolean(soldOutTarget)}
        onOpenChange={(open) => {
          if (!open) setSoldOutTarget(null);
        }}
      >
        <Modal.Backdrop isDismissable>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <Modal.Heading>Mark Vehicle as Sold Out?</Modal.Heading>
                </div>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-slate-600">
                  Are you sure you want to mark{" "}
                  <strong>
                    {soldOutTarget?.year} {soldOutTarget?.make}{" "}
                    {soldOutTarget?.name}
                  </strong>{" "}
                  as Sold Out?
                </p>
                <p className="mt-2 text-sm text-red-600">
                  This will immediately remove it from the website and{" "}
                  <strong>
                    permanently delete all {soldOutTarget?.images.length ?? 0}{" "}
                    image(s)
                    {soldOutTarget?.carfaxKey ? " and its Carfax PDF" : ""} from
                    AWS S3
                  </strong>
                  .
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={() => setSoldOutTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={busy}
                  onPress={() => void confirmMarkSoldOut()}
                >
                  {busy ? "Processing..." : "Confirm Sold Out"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
