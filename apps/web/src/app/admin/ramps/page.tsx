"use client";

import { Alert, Button, Chip, Modal, Spinner } from "@heroui/react";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteRamp,
  adminListRamps,
  adminUpdateRamp,
  ApiError,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { LoadingRamp } from "@/lib/types";

export default function AdminRampsPage() {
  const [ramps, setRamps] = useState<LoadingRamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [soldOutTarget, setSoldOutTarget] = useState<LoadingRamp | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminListRamps({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setRamps(res.items);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load loading ramps",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmMarkSoldOut() {
    if (!soldOutTarget) return;
    setBusy(true);
    try {
      await adminUpdateRamp(soldOutTarget.id, { status: "sold_out" });
      setSoldOutTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ramp: LoadingRamp) {
    if (
      !window.confirm(
        `Permanently delete Loading Ramp #${ramp.stockNumber} and all its S3 images?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adminDeleteRamp(ramp.id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete loading ramp",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loading Ramps</h1>
          <p className="text-sm text-slate-500">
            Sold-out ramps are hidden from the website and have their S3 images
            deleted.
          </p>
        </div>
        <Link
          href="/admin/ramps/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Loading Ramp
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock #, material, description..."
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
        ) : ramps.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No loading ramps found.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Stock #</th>
                <th className="px-4 py-3">Specs (mm / kg)</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ramps.map((ramp) => (
                <tr key={ramp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {ramp.primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ramp.primaryImage.url}
                        alt={`Ramp #${ramp.stockNumber}`}
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
                      #{ramp.stockNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ramp.material || "N/A"} &bull; {ramp.images.length} images
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {ramp.length ?? "-"} × {ramp.width ?? "-"} ×{" "}
                    {ramp.height ?? "-"} mm
                    <div className="text-slate-400">
                      Cap: {ramp.capacity ?? "-"} kg
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(ramp.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Chip
                      size="sm"
                      color={ramp.status === "in_stock" ? "success" : "danger"}
                    >
                      {ramp.status === "in_stock" ? "In Stock" : "Sold Out"}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {ramp.status === "in_stock" && (
                        <Button
                          size="sm"
                          variant="danger-soft"
                          isDisabled={busy}
                          onPress={() => setSoldOutTarget(ramp)}
                        >
                          Mark Sold Out
                        </Button>
                      )}
                      <Link
                        href={`/admin/ramps/${ramp.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        isDisabled={busy}
                        onPress={() => void handleDelete(ramp)}
                        aria-label={`Delete Ramp ${ramp.stockNumber}`}
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
                  <Modal.Heading>Mark Loading Ramp as Sold Out?</Modal.Heading>
                </div>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-slate-600">
                  Marking <strong>Loading Ramp #{soldOutTarget?.stockNumber}</strong>{" "}
                  as Sold Out will remove it from the website and{" "}
                  <strong>
                    permanently delete all {soldOutTarget?.images.length ?? 0}{" "}
                    S3 image(s)
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
