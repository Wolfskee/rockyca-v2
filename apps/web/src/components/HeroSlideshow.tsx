"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/images/Car.jpg", alt: "Premium Vehicles at Rocky Trading Co." },
  { src: "/images/ramp.jpg", alt: "Heavy-Duty Loading Ramps at Rocky Trading Co." },
];

export function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[56vh] min-h-[420px] overflow-hidden bg-slate-900">
      <div className="absolute inset-0 h-full w-full">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={index !== activeIndex}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt}
              fetchPriority={index === 0 ? "high" : "low"}
              loading={index === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-slate-950/55" />

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Premium Vehicles &amp; Loading Ramps
          </h1>
          <p className="mb-4 text-lg text-slate-200 sm:text-xl">
            Discover our carefully curated collection of quality vehicles and
            heavy-duty loading ramps in Winnipeg.
          </p>
          <p className="mb-8 text-lg font-medium text-blue-200">
            Contact us:{" "}
            <a href="tel:+12042565277" className="underline hover:text-white">
              +1 (204)-256-5277
            </a>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inventory"
              className="inline-flex items-center rounded-lg bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              View Inventory
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-7 py-3 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show slide ${index + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
