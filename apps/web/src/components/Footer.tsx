import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="mb-3 text-2xl font-bold">Rocky Trading Co.</h3>
            <p className="max-w-md text-slate-300">
              Your trusted partner in premium vehicles and heavy-duty loading
              ramps in Winnipeg, Manitoba.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/inventory" className="hover:text-white">
                  Inventory
                </Link>
              </li>
              <li>
                <Link href="/inventory/cars" className="hover:text-white">
                  Vehicles
                </Link>
              </li>
              <li>
                <Link href="/inventory/ramps" className="hover:text-white">
                  Loading Ramps
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Contact</h3>
            <ul className="space-y-2 text-slate-300">
              <li>1383 Dugald Road</li>
              <li>Winnipeg, MB R2J 0H3</li>
              <li>
                <a href="tel:+12042565277" className="hover:text-white">
                  Phone: +1 (204)-256-5277
                </a>
              </li>
              <li>
                <a href="mailto:sales@rockyca.com" className="hover:text-white">
                  Email: sales@rockyca.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
          &copy; {year} Rocky Trading Co. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
