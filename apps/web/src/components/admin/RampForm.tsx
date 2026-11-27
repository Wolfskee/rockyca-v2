"use client";

import { Alert, Button, Modal } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  adminAttachRampImage,
  adminCreateRamp,
  adminDeleteRampImage,
  adminSetRampPrimaryImage,
  adminUpdateRamp,
  ApiError,
} from "@/lib/api";
import type { InventoryStatus, LoadingRamp } from "@/lib/types";
import { S3ImageManager } from "./S3ImageManager";

interface RampFormProps {
  initialRamp?: LoadingRamp;
}

export function RampForm({ initialRamp }: RampFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialRamp);

  const [ramp, setRamp] = useState<LoadingRamp | undefined>(initialRamp);
  const [stockNumber, setStockNumber] = useState(
    initialRamp?.stockNumber ?? "",
  );
  const [price, setPrice] = useState(String(initialRamp?.price ?? ""));
  const [status, setStatus] = useState<InventoryStatus>(
    initialRamp?.status ?? "in_stock",
  );
  const [length, setLength] = useState(
    initialRamp?.length !== null && initialRamp?.length !== undefined
      ? String(initialRamp.length)
      : "",
  );
  const [width, setWidth] = useState(
    initialRamp?.width !== null && initialRamp?.width !== undefined
      ? String(initialRamp.width)
      : "",
  );
  const [height, setHeight] = useState(
    initialRamp?.height !== null && initialRamp?.height !== undefined
      ? String(initialRamp.height)
      : "",
  );
  const [weight, setWeight] = useState(
    initialRamp?.weight !== null && initialRamp?.weight !== undefined
      ? String(initialRamp.weight)
      : "",
  );
  const [capacity, setCapacity] = useState(
    initialRamp?.capacity !== null && initialRamp?.capacity !== undefined
      ? String(initialRamp.capacity)
      : "",
  );
  const [material, setMaterial] = useState(initialRamp?.material ?? "");
  const [description, setDescription] = useState(
    initialRamp?.description ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showSoldOutModal, setShowSoldOutModal] = useState(false);

  const toOptNum = (v: string) => (v.trim() === "" ? null : Number(v));

  async function persistRamp() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload = {
        stockNumber,
        price: Number(price),
        status,
        length: toOptNum(length),
        width: toOptNum(width),
        height: toOptNum(height),
        weight: toOptNum(weight),
        capacity: toOptNum(capacity),
        material: material.trim() || null,
        description,
      };

      if (isEdit && ramp) {
        const updated = await adminUpdateRamp(ramp.id, payload);
        setRamp(updated);
        setSavedMsg(
          updated.status === "sold_out"
            ? "Loading ramp marked Sold Out: hidden from website and S3 images removed."
            : "Loading ramp updated successfully.",
        );
      } else {
        const created = await adminCreateRamp(payload);
        router.push(`/admin/ramps/${created.id}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save loading ramp",
      );
    } finally {
      setSaving(false);
      setShowSoldOutModal(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const transitioningToSoldOut =
      isEdit &&
      ramp?.status === "in_stock" &&
      status === "sold_out" &&
      (ramp.images?.length ?? 0) > 0;

    if (transitioningToSoldOut) {
      setShowSoldOutModal(true);
      return;
    }

    void persistRamp();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {savedMsg && (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{savedMsg}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="ramp-stock" className="mb-1 block text-xs font-medium text-slate-700">
              Stock Number *
            </label>
            <input
              id="ramp-stock"
              required
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-price" className="mb-1 block text-xs font-medium text-slate-700">
              Price (CAD) *
            </label>
            <input
              id="ramp-price"
              type="number"
              step="0.01"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-status" className="mb-1 block text-xs font-medium text-slate-700">
              Status *
            </label>
            <select
              id="ramp-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InventoryStatus)}
              className={inputClass}
            >
              <option value="in_stock">In Stock (Visible on Website)</option>
              <option value="sold_out">
                Sold Out (Hide &amp; Delete S3 Images)
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="ramp-length" className="mb-1 block text-xs font-medium text-slate-700">
              Length (mm)
            </label>
            <input
              id="ramp-length"
              type="number"
              step="0.01"
              min={0}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-width" className="mb-1 block text-xs font-medium text-slate-700">
              Width (mm)
            </label>
            <input
              id="ramp-width"
              type="number"
              step="0.01"
              min={0}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-height" className="mb-1 block text-xs font-medium text-slate-700">
              Height (mm)
            </label>
            <input
              id="ramp-height"
              type="number"
              step="0.01"
              min={0}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="ramp-weight" className="mb-1 block text-xs font-medium text-slate-700">
              Weight (kg)
            </label>
            <input
              id="ramp-weight"
              type="number"
              step="0.01"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-capacity" className="mb-1 block text-xs font-medium text-slate-700">
              Capacity (kg)
            </label>
            <input
              id="ramp-capacity"
              type="number"
              step="0.01"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ramp-material" className="mb-1 block text-xs font-medium text-slate-700">
              Material
            </label>
            <input
              id="ramp-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. Heavy-duty Aluminum"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="ramp-description"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Description *
          </label>
          <textarea
            id="ramp-description"
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="secondary"
            onPress={() => router.push("/admin/ramps")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Ramp & Upload Images"}
          </Button>
        </div>
      </form>

      {isEdit && ramp && (
        <S3ImageManager
          folder="ramps"
          status={ramp.status}
          images={ramp.images}
          onAttach={async (payload) => {
            const img = await adminAttachRampImage(ramp.id, payload);
            setRamp((prev) =>
              prev
                ? {
                    ...prev,
                    images: [
                      ...(img.isPrimary
                        ? prev.images.map((i) => ({ ...i, isPrimary: false }))
                        : prev.images),
                      img,
                    ].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
                  }
                : prev,
            );
            return img;
          }}
          onSetPrimary={async (imageId) => {
            await adminSetRampPrimaryImage(ramp.id, imageId);
            setRamp((prev) =>
              prev
                ? {
                    ...prev,
                    images: prev.images
                      .map((i) => ({ ...i, isPrimary: i.id === imageId }))
                      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
                  }
                : prev,
            );
          }}
          onDelete={async (imageId) => {
            await adminDeleteRampImage(ramp.id, imageId);
            setRamp((prev) =>
              prev
                ? {
                    ...prev,
                    images: prev.images.filter((i) => i.id !== imageId),
                  }
                : prev,
            );
          }}
        />
      )}

      <Modal
        isOpen={showSoldOutModal}
        onOpenChange={(open) => setShowSoldOutModal(open)}
      >
        <Modal.Backdrop isDismissable>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <Modal.Heading>Confirm Mark as Sold Out</Modal.Heading>
                </div>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-slate-600">
                  Marking this loading ramp as <strong>Sold Out</strong> will
                  remove it from the public website and{" "}
                  <strong>permanently delete all associated S3 images</strong>.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={() => setShowSoldOutModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={saving}
                  onPress={() => void persistRamp()}
                >
                  {saving ? "Processing..." : "Confirm Sold Out & Delete S3 Images"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
