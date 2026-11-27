"use client";

import { Alert, Button, Modal } from "@heroui/react";
import { AlertTriangle, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import {
  adminAttachCarImage,
  adminCreateCar,
  adminDeleteCarImage,
  adminSetCarPrimaryImage,
  adminUpdateCar,
  ApiError,
  uploadFileDirectToS3,
} from "@/lib/api";
import type {
  Car,
  CarType,
  Drivetrain,
  FuelType,
  InventoryStatus,
  Transmission,
} from "@/lib/types";
import { S3ImageManager } from "./S3ImageManager";

interface CarFormProps {
  initialCar?: Car;
}

export function CarForm({ initialCar }: CarFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialCar);

  const [car, setCar] = useState<Car | undefined>(initialCar);
  const [name, setName] = useState(initialCar?.name ?? "");
  const [make, setMake] = useState(initialCar?.make ?? "");
  const [year, setYear] = useState(String(initialCar?.year ?? new Date().getFullYear()));
  const [price, setPrice] = useState(String(initialCar?.price ?? ""));
  const [stockNumber, setStockNumber] = useState(initialCar?.stockNumber ?? "");
  const [vin, setVin] = useState(initialCar?.vin ?? "");
  const [status, setStatus] = useState<InventoryStatus>(
    initialCar?.status ?? "in_stock",
  );
  const [type, setType] = useState<CarType | "">(initialCar?.type ?? "");
  const [mileage, setMileage] = useState(String(initialCar?.mileage ?? "0"));
  const [transmission, setTransmission] = useState<Transmission>(
    initialCar?.transmission ?? "auto",
  );
  const [fuel, setFuel] = useState<FuelType>(initialCar?.fuel ?? "gas");
  const [drivetrain, setDrivetrain] = useState<Drivetrain>(
    initialCar?.drivetrain ?? "awd",
  );
  const [engine, setEngine] = useState(initialCar?.engine ?? "");
  const [cylinders, setCylinders] = useState(initialCar?.cylinders ?? "");
  const [color, setColor] = useState(initialCar?.color ?? "");
  const [interiorColor, setInteriorColor] = useState(
    initialCar?.interiorColor ?? "",
  );
  const [doors, setDoors] = useState(String(initialCar?.doors ?? 4));
  const [maxPassengers, setMaxPassengers] = useState(
    String(initialCar?.maxPassengers ?? 5),
  );
  const [description, setDescription] = useState(initialCar?.description ?? "");
  const [carfaxKey, setCarfaxKey] = useState<string | null>(
    initialCar?.carfaxKey ?? null,
  );
  const [carfaxUrl, setCarfaxUrl] = useState<string | null>(
    initialCar?.carfaxUrl ?? null,
  );

  const [uploadingCarfax, setUploadingCarfax] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showSoldOutModal, setShowSoldOutModal] = useState(false);

  const buildPayload = () => ({
    name,
    make,
    year: Number(year),
    price: Number(price),
    stockNumber,
    vin,
    status,
    type: type || null,
    mileage: Number(mileage),
    transmission,
    fuel,
    drivetrain,
    engine,
    cylinders,
    color,
    interiorColor,
    doors: Number(doors),
    maxPassengers: Number(maxPassengers),
    description,
    carfaxKey: status === "sold_out" ? null : carfaxKey,
    carfaxUrl: status === "sold_out" ? null : carfaxUrl,
  });

  async function persistCar() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload = buildPayload();
      if (isEdit && car) {
        const updated = await adminUpdateCar(car.id, payload);
        setCar(updated);
        setCarfaxKey(updated.carfaxKey);
        setCarfaxUrl(updated.carfaxUrl);
        setSavedMsg(
          updated.status === "sold_out"
            ? "Vehicle marked Sold Out: hidden from website and all S3 images & Carfax PDF removed."
            : "Vehicle updated successfully.",
        );
      } else {
        const created = await adminCreateCar(payload);
        router.push(`/admin/cars/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
      setShowSoldOutModal(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const transitioningToSoldOut =
      isEdit &&
      car?.status === "in_stock" &&
      status === "sold_out" &&
      ((car.images?.length ?? 0) > 0 || Boolean(car.carfaxKey));

    if (transitioningToSoldOut) {
      setShowSoldOutModal(true);
      return;
    }

    void persistCar();
  }

  async function handleCarfaxUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingCarfax(true);
    setError(null);
    try {
      const { s3Key, publicUrl } = await uploadFileDirectToS3(file, "carfax");
      setCarfaxKey(s3Key);
      setCarfaxUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload Carfax PDF",
      );
    } finally {
      setUploadingCarfax(false);
    }
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
            <label htmlFor="car-make" className="mb-1 block text-xs font-medium text-slate-700">
              Make *
            </label>
            <input
              id="car-make"
              required
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Toyota"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-name" className="mb-1 block text-xs font-medium text-slate-700">
              Model / Name *
            </label>
            <input
              id="car-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. RAV4 XLE"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-year" className="mb-1 block text-xs font-medium text-slate-700">
              Year *
            </label>
            <input
              id="car-year"
              type="number"
              required
              min={1900}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="car-price" className="mb-1 block text-xs font-medium text-slate-700">
              Price (CAD) *
            </label>
            <input
              id="car-price"
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
            <label htmlFor="car-stock" className="mb-1 block text-xs font-medium text-slate-700">
              Stock Number *
            </label>
            <input
              id="car-stock"
              required
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-vin" className="mb-1 block text-xs font-medium text-slate-700">
              VIN (17 chars) *
            </label>
            <input
              id="car-vin"
              required
              minLength={5}
              maxLength={17}
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="car-status" className="mb-1 block text-xs font-medium text-slate-700">
              Status *
            </label>
            <select
              id="car-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InventoryStatus)}
              className={inputClass}
            >
              <option value="in_stock">In Stock (Visible on Website)</option>
              <option value="sold_out">
                Sold Out (Hide &amp; Delete S3 Images/Carfax)
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="car-type" className="mb-1 block text-xs font-medium text-slate-700">
              Vehicle Type
            </label>
            <select
              id="car-type"
              value={type}
              onChange={(e) => setType(e.target.value as CarType | "")}
              className={inputClass}
            >
              <option value="">Unspecified</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>
          <div>
            <label htmlFor="car-mileage" className="mb-1 block text-xs font-medium text-slate-700">
              Mileage (KM) *
            </label>
            <input
              id="car-mileage"
              type="number"
              min={0}
              required
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="car-transmission" className="mb-1 block text-xs font-medium text-slate-700">
              Transmission *
            </label>
            <select
              id="car-transmission"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value as Transmission)}
              className={inputClass}
            >
              <option value="auto">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label htmlFor="car-fuel" className="mb-1 block text-xs font-medium text-slate-700">
              Fuel Type *
            </label>
            <select
              id="car-fuel"
              value={fuel}
              onChange={(e) => setFuel(e.target.value as FuelType)}
              className={inputClass}
            >
              <option value="gas">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label htmlFor="car-drivetrain" className="mb-1 block text-xs font-medium text-slate-700">
              Drivetrain *
            </label>
            <select
              id="car-drivetrain"
              value={drivetrain}
              onChange={(e) => setDrivetrain(e.target.value as Drivetrain)}
              className={inputClass}
            >
              <option value="awd">All-Wheel Drive</option>
              <option value="fwd">Front-Wheel Drive</option>
              <option value="rwd">Rear-Wheel Drive</option>
            </select>
          </div>

          <div>
            <label htmlFor="car-engine" className="mb-1 block text-xs font-medium text-slate-700">
              Engine *
            </label>
            <input
              id="car-engine"
              required
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="e.g. 2.5L 4-Cylinder"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-cylinders" className="mb-1 block text-xs font-medium text-slate-700">
              Cylinders *
            </label>
            <input
              id="car-cylinders"
              required
              value={cylinders}
              onChange={(e) => setCylinders(e.target.value)}
              placeholder="e.g. 4"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-color" className="mb-1 block text-xs font-medium text-slate-700">
              Exterior Color *
            </label>
            <input
              id="car-color"
              required
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="car-interior" className="mb-1 block text-xs font-medium text-slate-700">
              Interior Color *
            </label>
            <input
              id="car-interior"
              required
              value={interiorColor}
              onChange={(e) => setInteriorColor(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-doors" className="mb-1 block text-xs font-medium text-slate-700">
              Doors *
            </label>
            <input
              id="car-doors"
              type="number"
              min={1}
              max={10}
              required
              value={doors}
              onChange={(e) => setDoors(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="car-passengers" className="mb-1 block text-xs font-medium text-slate-700">
              Max Passengers *
            </label>
            <input
              id="car-passengers"
              type="number"
              min={1}
              max={20}
              required
              value={maxPassengers}
              onChange={(e) => setMaxPassengers(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Carfax PDF S3 Uploader */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Carfax Report (PDF on AWS S3)
                </p>
                <p className="text-xs text-slate-500">
                  Optional PDF (max 20MB). Automatically deleted from S3 when
                  marked Sold Out.
                </p>
              </div>
            </div>

            {status !== "sold_out" && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                <Upload className="h-3.5 w-3.5" />
                {uploadingCarfax ? "Uploading PDF..." : "Upload Carfax PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploadingCarfax}
                  onChange={handleCarfaxUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {carfaxUrl && status !== "sold_out" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
              <a
                href={carfaxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
              >
                View Uploaded Carfax PDF
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button
                size="sm"
                variant="danger-soft"
                onPress={() => {
                  setCarfaxKey(null);
                  setCarfaxUrl(null);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="car-description"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Description *
          </label>
          <textarea
            id="car-description"
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
            onPress={() => router.push("/admin/cars")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving || uploadingCarfax}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Vehicle & Upload Images"}
          </Button>
        </div>
      </form>

      {isEdit && car && (
        <S3ImageManager
          folder="cars"
          status={car.status}
          images={car.images}
          onAttach={async (payload) => {
            const img = await adminAttachCarImage(car.id, payload);
            setCar((prev) =>
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
            await adminSetCarPrimaryImage(car.id, imageId);
            setCar((prev) =>
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
            await adminDeleteCarImage(car.id, imageId);
            setCar((prev) =>
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

      {/* Confirmation Modal for destructive Sold Out S3 cleanup */}
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
                  Marking this vehicle as <strong>Sold Out</strong> will:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Immediately remove it from the public website (returns 404).</li>
                  <li>
                    <strong>Permanently delete</strong> all associated vehicle
                    images and its Carfax PDF from AWS S3.
                  </li>
                  <li>Keep the text record archived here in the admin panel.</li>
                </ul>
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
                  onPress={() => void persistCar()}
                >
                  {saving ? "Processing..." : "Confirm Sold Out & Delete S3 Files"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
