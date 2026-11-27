"use client";

import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MAPS_URL = "https://maps.app.goo.gl/jCjakGXhwWE5vuHB9";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileInventoryOpen, setMobileInventoryOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/RockyLogo.jpg"
                alt="Rocky Trading Co."
                className="h-14 w-auto object-contain"
              />
              <span className="hidden text-2xl font-bold tracking-tight text-blue-900 sm:block">
                Rocky Trading Co.
              </span>
            </Link>

            <div className="hidden md:ml-16 md:flex md:items-center md:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center border-b-2 px-1 py-2 text-base font-medium transition-colors ${
                  isActive("/")
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-800 hover:border-blue-500 hover:text-blue-700"
                }`}
              >
                Home
              </Link>

              <div className="group relative flex items-center">
                <Link
                  href="/inventory"
                  className={`inline-flex items-center gap-1 border-b-2 px-1 py-2 text-base font-medium transition-colors ${
                    isActive("/inventory")
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-800 hover:border-blue-500 hover:text-blue-700"
                  }`}
                >
                  Inventory
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="invisible absolute left-0 top-full z-50 w-48 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                    <Link
                      href="/inventory"
                      className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    >
                      All Inventory
                    </Link>
                    <Link
                      href="/inventory/cars"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    >
                      Vehicles
                    </Link>
                    <Link
                      href="/inventory/ramps"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                    >
                      Loading Ramps
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/about"
                className={`inline-flex items-center border-b-2 px-1 py-2 text-base font-medium transition-colors ${
                  isActive("/about")
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-800 hover:border-blue-500 hover:text-blue-700"
                }`}
              >
                About
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center border-b-2 px-1 py-2 text-base font-medium transition-colors ${
                  isActive("/contact")
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-800 hover:border-blue-500 hover:text-blue-700"
                }`}
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="hidden md:flex md:items-center">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4" />
              Visit Us
            </a>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="sr-only">Toggle main menu</span>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Home
            </Link>

            <div>
              <button
                type="button"
                onClick={() => setMobileInventoryOpen((prev) => !prev)}
                aria-expanded={mobileInventoryOpen}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>Inventory</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    mobileInventoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileInventoryOpen && (
                <div className="space-y-1 pl-6">
                  <Link
                    href="/inventory"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    All Inventory
                  </Link>
                  <Link
                    href="/inventory/cars"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Vehicles
                  </Link>
                  <Link
                    href="/inventory/ramps"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Loading Ramps
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2.5 text-base font-medium text-slate-800 hover:bg-slate-50"
            >
              Contact
            </Link>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4" />
              Visit Us
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
