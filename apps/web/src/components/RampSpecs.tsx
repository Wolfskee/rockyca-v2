"use client";

import { useState } from "react";
import { kgToLbs, mmToInches } from "@/lib/format";
import type { LoadingRamp } from "@/lib/types";

interface RampSpecsProps {
  ramp: Pick<
    LoadingRamp,
    "length" | "width" | "height" | "weight" | "capacity" | "material"
  >;
}

export function RampSpecs({ ramp }: RampSpecsProps) {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  const formatDim = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return unit === "metric" ? `${value} mm` : `${mmToInches(value)} inches`;
  };

  const formatWeight = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return unit === "metric" ? `${value} kg` : `${kgToLbs(value)} lbs`;
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">Specifications</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Units:</span>
          <div
            role="group"
            aria-label="Measurement units"
            className="inline-flex rounded-full bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setUnit("metric")}
              aria-pressed={unit === "metric"}
              className={`rounded-full px-3.5 py-1 text-sm font-medium transition-colors ${
                unit === "metric"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              MM / KG
            </button>
            <button
              type="button"
              onClick={() => setUnit("imperial")}
              aria-pressed={unit === "imperial"}
              className={`rounded-full px-3.5 py-1 text-sm font-medium transition-colors ${
                unit === "imperial"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              INCH / LBS
            </button>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-500">Length</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatDim(ramp.length)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Width</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatDim(ramp.width)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Height</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatDim(ramp.height)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Weight</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatWeight(ramp.weight)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Capacity</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatWeight(ramp.capacity)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Material</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {ramp.material || "N/A"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
