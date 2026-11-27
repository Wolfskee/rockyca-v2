import type { Metadata } from "next";
import Link from "next/link";
import { fetchPublicCars } from "@/lib/api";
import {
  CAR_TYPE_LABELS,
  formatCurrency,
  formatMileage,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/format";
import type { CarType } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vehicles",
};

const VALID_TYPES: CarType[] = ["sedan", "suv", "pickup"];

export default async function CarsListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentType = VALID_TYPES.includes(params.type as CarType)
    ? (params.type as CarType)
    : undefined;
  const currentPage = Math.max(1, Number(params.page) || 1);

  let data = {
    items: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  } as Awaited<ReturnType<typeof fetchPublicCars>>;
  let apiUnavailable = false;

  try {
    data = await fetchPublicCars({ type: currentType, page: currentPage, limit: 12 });
  } catch {
    apiUnavailable = true;
  }

  const buildPageHref = (page: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    if (currentType) qs.set("type", currentType);
    return `/inventory/cars?${qs.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Vehicles</h1>
        <span className="text-sm text-slate-500">
          {data.pagination.total} available
        </span>
      </div>

      {/* Type Filter Tabs */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          <Link
            href="/inventory/cars"
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              !currentType
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </Link>
          {VALID_TYPES.map((type) => (
            <Link
              key={type}
              href={`/inventory/cars?type=${type}`}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                currentType === type
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {CAR_TYPE_LABELS[type]}
            </Link>
          ))}
        </div>
      </div>

      {apiUnavailable && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Unable to load vehicles right now. Please try again shortly.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.items.length > 0 ? (
          data.items.map((car) => (
            <article
              key={car.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
            >
              {car.primaryImage ? (
                <div className="flex h-60 items-center justify-center bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={car.primaryImage.url}
                    alt={`${car.year} ${car.make} ${car.name}`}
                    loading="lazy"
                    className="max-h-full max-w-full rounded object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-60 w-full items-center justify-center bg-slate-100 text-slate-400">
                  No Image
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {car.year} {car.make} {car.name}
                  </h2>
                </div>

                {car.type && (
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {CAR_TYPE_LABELS[car.type]}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 text-sm text-slate-600">
                  <p>Stock #: {car.stockNumber}</p>
                  <p>Mileage: {formatMileage(car.mileage)}</p>
                  <p>Transmission: {TRANSMISSION_LABELS[car.transmission]}</p>
                  <p>Fuel: {FUEL_LABELS[car.fuel]}</p>
                </div>

                <div className="mt-auto pt-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(car.price)}
                  </p>
                  <Link
                    href={`/inventory/cars/${car.id}`}
                    className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
            No vehicles available in this category.
          </div>
        )}
      </div>

      {data.pagination.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-2"
        >
          {data.pagination.page > 1 && (
            <>
              <Link
                href={buildPageHref(1)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &laquo; First
              </Link>
              <Link
                href={buildPageHref(data.pagination.page - 1)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Previous
              </Link>
            </>
          )}

          <span className="px-4 py-2 text-sm text-slate-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>

          {data.pagination.page < data.pagination.totalPages && (
            <>
              <Link
                href={buildPageHref(data.pagination.page + 1)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Next
              </Link>
              <Link
                href={buildPageHref(data.pagination.totalPages)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Last &raquo;
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
