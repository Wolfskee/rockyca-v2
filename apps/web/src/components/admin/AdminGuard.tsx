"use client";

import { Button, Spinner } from "@heroui/react";
import {
  Car as CarIcon,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGetMe, adminLogout } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/cars", label: "Vehicles", icon: CarIcon, exact: false },
  { href: "/admin/ramps", label: "Loading Ramps", icon: Wrench, exact: false },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail, exact: false },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    adminGetMe()
      .then((res) => {
        if (!cancelled) {
          setUser(res.user);
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setChecking(false);
          router.replace("/admin/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      router.replace("/admin/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white md:flex">
        <div className="border-b border-slate-800 px-6 py-5">
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Rocky Trading Admin
          </Link>
          <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-800 p-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View Live Website
          </Link>
          <Button
            variant="ghost"
            fullWidth
            onPress={handleLogout}
            className="justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link href="/admin" className="font-bold text-slate-900">
            Rocky Admin
          </Link>
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
