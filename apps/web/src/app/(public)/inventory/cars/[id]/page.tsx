import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/ImageGallery";
import { fetchPublicCarById } from "@/lib/api";
import {
  CAR_TYPE_LABELS,
  DRIVETRAIN_LABELS,
  formatCurrency,
  formatMileage,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) return { title: "Vehicle Not Found" };
  try {
    const car = await fetchPublicCarById(numId);
    if (!car) return { title: "Vehicle Not Found" };
    return { title: `${car.year} ${car.make} ${car.name}` };
  } catch {
    return { title: "Vehicle Details" };
  }
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    notFound();
  }

  const car = await fetchPublicCarById(numId);
  if (!car) {
    notFound();
  }

  const title = `${car.year} ${car.make} ${car.name}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/inventory/cars"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vehicles
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ImageGallery images={car.images} alt={title} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
                {car.type && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {CAR_TYPE_LABELS[car.type]}
                  </span>
                )}
              </div>
              <p className="text-slate-600">Stock #: {car.stockNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(car.price)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Vehicle Details
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Mileage</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatMileage(car.mileage)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">VIN</dt>
                  <dd className="break-all font-semibold text-slate-900">
                    {car.vin}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Transmission</dt>
                  <dd className="font-semibold text-slate-900">
                    {TRANSMISSION_LABELS[car.transmission]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Fuel Type</dt>
                  <dd className="font-semibold text-slate-900">
                    {FUEL_LABELS[car.fuel]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Drivetrain</dt>
                  <dd className="font-semibold text-slate-900">
                    {DRIVETRAIN_LABELS[car.drivetrain]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Engine</dt>
                  <dd className="font-semibold text-slate-900">{car.engine}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Cylinders</dt>
                  <dd className="font-semibold text-slate-900">
                    {car.cylinders}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Features
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-slate-500">Exterior Color</dt>
                  <dd className="font-semibold text-slate-900">{car.color}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Interior Color</dt>
                  <dd className="font-semibold text-slate-900">
                    {car.interiorColor}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Doors</dt>
                  <dd className="font-semibold text-slate-900">{car.doors}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Passengers</dt>
                  <dd className="font-semibold text-slate-900">
                    {car.maxPassengers}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Description
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {car.description}
            </p>
          </div>

          {car.carfaxUrl && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                Vehicle History
              </h2>
              <a
                href={car.carfaxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                View Carfax Report
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              href="/contact?subject=Vehicle%20Inquiry"
              className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Contact Us About This Vehicle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
