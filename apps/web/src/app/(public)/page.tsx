import { CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";

export default function HomePage() {
  return (
    <>
      <HeroSlideshow />

      {/* Featured Categories (Vehicles & Loading Ramps — ATV removed) */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Our Product Categories
          </h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ve_Category.png"
                  alt="Vehicles Category"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  Vehicles
                </h3>
                <p className="mb-4 text-slate-600">
                  Experience ultimate comfort, reliability, and sophistication
                </p>
                <Link
                  href="/inventory/cars"
                  className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Collection &rarr;
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/ramp_Category.png"
                  alt="Loading Ramps Category"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  Loading Ramps
                </h3>
                <p className="mb-4 text-slate-600">
                  Heavy-duty solutions for safe vehicle and equipment transport
                </p>
                <Link
                  href="/inventory/ramps"
                  className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Collection &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Why Choose Rocky Trading Co.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Premium Selection
              </h3>
              <p className="text-slate-600">
                Carefully inspected collection of quality vehicles and ramps
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Secure Transactions
              </h3>
              <p className="text-slate-600">
                Safe, honest, and transparent buying process from start to
                finish
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                <Headphones className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Expert Support
              </h3>
              <p className="text-slate-600">
                Professional guidance throughout your acquisition journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Find Your Perfect Vehicle?
          </h2>
          <p className="mb-8 text-lg text-blue-100 sm:text-xl">
            Contact us today to schedule a viewing or learn more about our
            current inventory
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-700 shadow-sm transition-colors hover:bg-slate-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
