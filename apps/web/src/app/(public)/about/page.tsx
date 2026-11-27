import { Check, Compass, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <>
      <section className="relative bg-slate-900 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold">About Rocky Trading Co.</h1>
          <p className="text-xl text-slate-300">
            Your trusted partner in premium vehicle acquisitions &amp;
            heavy-duty loading ramps
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-slate-900">
                Our Story
              </h2>
              <p className="mb-4 leading-relaxed text-slate-600">
                Based in Winnipeg, Manitoba, Rocky Trading Co. specializes in
                bringing dependable, carefully selected vehicles and
                commercial-grade loading ramps to clients across Canada. Our
                commitment to quality and transparent customer service has made
                us a trusted name in the industry.
              </p>
              <p className="leading-relaxed text-slate-600">
                Every vehicle in our showroom is hand-picked and accompanied by
                clear history details so you can purchase with confidence.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Car.jpg"
                alt="Rocky Trading Co. showroom vehicles"
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Our Values
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">Quality</h3>
              <p className="text-slate-600">
                We maintain strict standards in vehicle inspection, loading ramp
                specifications, and customer care.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Integrity
              </h3>
              <p className="text-slate-600">
                Transparency, clear vehicle history reports, and honest pricing
                are at the core of everything we do.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Service
              </h3>
              <p className="text-slate-600">
                From first inquiry to final handover, our team guides you every
                step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Want to Learn More?
          </h2>
          <p className="mb-8 text-lg text-blue-100">
            Get in touch with our team to discuss your vehicle or loading ramp
            needs
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-700 transition-colors hover:bg-slate-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
