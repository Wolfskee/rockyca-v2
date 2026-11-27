import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/ImageGallery";
import { RampSpecs } from "@/components/RampSpecs";
import { fetchPublicRampById } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) return { title: "Loading Ramp Not Found" };
  try {
    const ramp = await fetchPublicRampById(numId);
    if (!ramp) return { title: "Loading Ramp Not Found" };
    return { title: `Loading Ramp #${ramp.stockNumber}` };
  } catch {
    return { title: "Loading Ramp Details" };
  }
}

export default async function RampDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    notFound();
  }

  const ramp = await fetchPublicRampById(numId);
  if (!ramp) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/inventory/ramps"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Loading Ramps
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ImageGallery
          images={ramp.images}
          alt={`Loading Ramp #${ramp.stockNumber}`}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900">
                Loading Ramp
              </h1>
              <p className="text-slate-600">Stock #: {ramp.stockNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(ramp.price)}
              </p>
            </div>
          </div>

          <RampSpecs ramp={ramp} />

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Description
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {ramp.description}
            </p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/contact?subject=General%20Question"
              className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Contact Us About This Loading Ramp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
