"use client";

import { Alert, Button, Chip } from "@heroui/react";
import { Star, Trash2, Upload } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { uploadFileDirectToS3 } from "@/lib/api";
import type { InventoryStatus, VehicleImage } from "@/lib/types";

interface S3ImageManagerProps {
  folder: "cars" | "ramps";
  status: InventoryStatus;
  images: VehicleImage[];
  onAttach: (payload: {
    s3Key: string;
    url: string;
    isPrimary?: boolean;
  }) => Promise<VehicleImage>;
  onSetPrimary: (imageId: number) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
}

export function S3ImageManager({
  folder,
  status,
  images,
  onAttach,
  onSetPrimary,
  onDelete,
}: S3ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const isSoldOut = status === "sold_out";

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`Uploading ${i + 1} of ${files.length}: ${file.name}...`);
        const { s3Key, publicUrl } = await uploadFileDirectToS3(file, folder);
        await onAttach({
          s3Key,
          url: publicUrl,
          isPrimary: images.length === 0 && i === 0,
        });
      }
      setProgressText(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
      setProgressText(null);
    } finally {
      setUploading(false);
    }
  }

  async function handlePrimary(imageId: number) {
    setError(null);
    setBusyId(imageId);
    try {
      await onSetPrimary(imageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set primary");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(imageId: number) {
    setError(null);
    setBusyId(imageId);
    try {
      await onDelete(imageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            AWS S3 Images ({images.length})
          </h2>
          <p className="text-xs text-slate-500">
            Supported: JPG, PNG, GIF, AVIF, WebP (max 10MB each). Uploaded
            directly to AWS S3.
          </p>
        </div>

        {!isSoldOut && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Images"}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.avif,.webp,image/*"
              multiple
              disabled={uploading}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {isSoldOut && (
        <Alert status="warning" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Sold Out — Images Removed</Alert.Title>
            <Alert.Description>
              Sold-out items are hidden from the website and have all S3 images
              removed. Switch status back to In Stock to upload new images.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {progressText && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          {progressText}
        </div>
      )}

      {error && (
        <Alert status="danger" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
          No images uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="relative h-44 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Image ${img.id}`}
                  className="h-full w-full object-contain p-1"
                />
                {img.isPrimary && (
                  <div className="absolute left-2 top-2">
                    <Chip color="accent" size="sm">
                      Primary
                    </Chip>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-2.5">
                {!img.isPrimary ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busyId === img.id}
                    onPress={() => handlePrimary(img.id)}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Set Primary
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-blue-700">
                    Main Thumbnail
                  </span>
                )}
                <Button
                  size="sm"
                  variant="danger-soft"
                  isDisabled={busyId === img.id}
                  onPress={() => handleDelete(img.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
