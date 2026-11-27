import type { Metadata } from "next";
import Link from "next/link";
import { fetchInventorySummary } from "@/lib/api";
import { formatCurrency, formatMileage } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function InventoryHomePage() {
  let summary = { cars: [], ramps: [], counts: { cars: 0, ramps: 0 } } as Awaited<
    ReturnType<typeof fetchInventorySummary>
  >;
  let apiUnavailable = false;

  try {
    summary = await fetchInventorySummary();
  } catch {
    apiUnavailable = true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
        <p className="mt-2 text-slate-600">
          Browse our currently available vehicles and heavy-duty loading ramps.
        </p>
      </div>

      {apiUnavailable && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Unable to load live inventory right now. Please refresh or call +1
          (204)-256-5277.
        </div>
      )}

      {/* Latest Vehicles */}
      <section className="mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Latest Vehicles ({summary.counts.cars})
          </h2>
          <Link
            href="/inventory/cars"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summary.cars.length > 0 ? (
            summary.cars.map((car) => (
              <div
                key={car.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
              >
                {car.primaryImage ? (
                  <div className="h-52 w-full bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.primaryImage.url}
                      alt={`${car.year} ${car.make} ${car.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-slate-400">
                    No Image
                  </div>
                )}
                <div className="p-5">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">
                    {car.year} {car.make} {car.name}
                  </h3>
                  <p className="mb-2 text-sm text-slate-600">
                    Mileage: {formatMileage(car.mileage)}
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(car.price)}
                  </p>
                  <Link
                    href={`/inventory/cars/${car.id}`}
                    className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              No vehicles currently in stock.
            </div>
          )}
        </div>
      </section>

      {/* Latest Loading Ramps */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Latest Loading Ramps ({summary.counts.ramps})
          </h2>
          <Link
            href="/inventory/ramps"
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {summary.ramps.length > 0 ? (
            summary.ramps.map((ramp) => (
              <div
                key={ramp.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
              >
                {ramp.primaryImage ? (
                  <div className="h-52 w-full bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ramp.primaryImage.url}
                      alt={`Loading Ramp #${ramp.stockNumber}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-slate-400">
                    No Image
                  </div>
                )}
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    Loading Ramp #{ramp.stockNumber}
                  </h3>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(ramp.price)}
                  </p>
                  <Link
                    href={`/inventory/ramps/${ramp.id}`}
                    className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              No loading ramps currently in stock.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
