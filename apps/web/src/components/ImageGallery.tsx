"use client";

import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VehicleImage } from "@/lib/types";

interface ImageGalleryProps {
  images: VehicleImage[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const count = images.length;
  const safeIndex = count > 0 ? Math.min(currentIndex, count - 1) : 0;
  const activeImage = count > 0 ? images[safeIndex] : null;

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const openLightbox = () => {
    if (!activeImage || !dialogRef.current) return;
    if (!dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  };

  const closeLightbox = () => {
    dialogRef.current?.close();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialog.open) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  if (!activeImage) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 bg-slate-100 text-slate-400">
        <ImageOff className="h-12 w-12" />
        <p className="text-sm font-medium">No Images Available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-100 px-4 py-6">
      <div className="relative flex w-full max-w-3xl items-center justify-center">
        {count > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={openLightbox}
          aria-label="Open full-size image preview"
          className="group relative overflow-hidden rounded-xl bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={alt}
            fetchPriority="high"
            className="h-96 max-h-[26rem] w-auto max-w-full cursor-zoom-in object-contain"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" />
            Zoom
          </span>
        </button>

        {count > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex w-full max-w-3xl justify-center gap-2 overflow-x-auto pb-1">
          {images.map((image, idx) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View image ${idx + 1} of ${count}`}
              aria-current={idx === safeIndex ? "true" : undefined}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                idx === safeIndex
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`${alt} thumbnail ${idx + 1}`}
                loading="lazy"
                className="h-16 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Native top-layer <dialog> Lightbox (provides built-in Esc, focus trap & inert backdrop) */}
      <dialog
        ref={dialogRef}
        aria-label={`${alt} full-size preview`}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeLightbox();
          }
        }}
        className="m-auto max-h-[92vh] max-w-[92vw] overflow-visible bg-transparent p-0"
      >
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close preview"
            autoFocus
            className="absolute -right-2 -top-12 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <X className="h-5 w-5" />
          </button>

          {count > 1 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-900 shadow-lg hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={alt}
            className="max-h-[85vh] max-w-[88vw] rounded-lg object-contain shadow-2xl"
          />

          {count > 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-slate-900 shadow-lg hover:bg-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      </dialog>
    </div>
  );
}
