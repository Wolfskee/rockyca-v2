"use client";

import { Card, Spinner } from "@heroui/react";
import { Car as CarIcon, Mail, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminListCars, adminListInquiries, adminListRamps } from "@/lib/api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    carsInStock: 0,
    carsSoldOut: 0,
    rampsInStock: 0,
    rampsSoldOut: 0,
    unreadInquiries: 0,
  });

  useEffect(() => {
    Promise.all([
      adminListCars({ status: "in_stock", page: 1 }),
      adminListCars({ status: "sold_out", page: 1 }),
      adminListRamps({ status: "in_stock", page: 1 }),
      adminListRamps({ status: "sold_out", page: 1 }),
      adminListInquiries(1),
    ])
      .then(([carsIn, carsSold, rampsIn, rampsSold, inquiries]) => {
        setStats({
          carsInStock: carsIn.pagination.total,
          carsSoldOut: carsSold.pagination.total,
          rampsInStock: rampsIn.pagination.total,
          rampsSoldOut: rampsSold.pagination.total,
          unreadInquiries: inquiries.unreadCount,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Manage Rocky Trading Co. inventory and verified customer inquiries.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
          <Link
            href="/admin/ramps/new"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add Loading Ramp
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="border border-slate-200 bg-white p-5">
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="text-sm font-medium text-slate-500">
              Vehicles
            </Card.Title>
            <CarIcon className="h-5 w-5 text-blue-600" />
          </Card.Header>
          <Card.Content className="mt-2">
            <p className="text-3xl font-bold text-slate-900">
              {stats.carsInStock}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              In Stock &bull; {stats.carsSoldOut} Sold Out (Archived)
            </p>
            <Link
              href="/admin/cars"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Manage Vehicles &rarr;
            </Link>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 bg-white p-5">
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="text-sm font-medium text-slate-500">
              Loading Ramps
            </Card.Title>
            <Wrench className="h-5 w-5 text-blue-600" />
          </Card.Header>
          <Card.Content className="mt-2">
            <p className="text-3xl font-bold text-slate-900">
              {stats.rampsInStock}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              In Stock &bull; {stats.rampsSoldOut} Sold Out (Archived)
            </p>
            <Link
              href="/admin/ramps"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Manage Loading Ramps &rarr;
            </Link>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 bg-white p-5">
          <Card.Header className="flex items-center justify-between">
            <Card.Title className="text-sm font-medium text-slate-500">
              Unread Inquiries
            </Card.Title>
            <Mail className="h-5 w-5 text-blue-600" />
          </Card.Header>
          <Card.Content className="mt-2">
            <p className="text-3xl font-bold text-slate-900">
              {stats.unreadInquiries}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Turnstile-verified contact messages
            </p>
            <Link
              href="/admin/inquiries"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              View Inquiries &rarr;
            </Link>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
