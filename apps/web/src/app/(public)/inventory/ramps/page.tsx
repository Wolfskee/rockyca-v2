import type { Metadata } from "next";
import Link from "next/link";
import { fetchPublicRamps } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loading Ramps",
};

export default async function RampsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);

  let data = {
    items: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
  } as Awaited<ReturnType<typeof fetchPublicRamps>>;
  let apiUnavailable = false;

  try {
    data = await fetchPublicRamps({ page: currentPage, limit: 12 });
  } catch {
    apiUnavailable = true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Loading Ramps</h1>
        <span className="text-sm text-slate-500">
          {data.pagination.total} available
        </span>
      </div>

      {apiUnavailable && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Unable to load loading ramps right now. Please try again shortly.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.items.length > 0 ? (
          data.items.map((ramp) => (
            <article
              key={ramp.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md"
            >
              {ramp.primaryImage ? (
                <div className="flex h-60 items-center justify-center bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ramp.primaryImage.url}
                    alt={`Loading Ramp #${ramp.stockNumber}`}
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
                <h2 className="mb-2 text-xl font-semibold text-slate-900">
                  Loading Ramp #{ramp.stockNumber}
                </h2>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {ramp.description}
                </p>

                <div className="mt-auto pt-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(ramp.price)}
                  </p>
                  <Link
                    href={`/inventory/ramps/${ramp.id}`}
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
            No loading ramps available.
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
                href="/inventory/ramps?page=1"
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &laquo; First
              </Link>
              <Link
                href={`/inventory/ramps?page=${data.pagination.page - 1}`}
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
                href={`/inventory/ramps?page=${data.pagination.page + 1}`}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Next
              </Link>
              <Link
                href={`/inventory/ramps?page=${data.pagination.totalPages}`}
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
