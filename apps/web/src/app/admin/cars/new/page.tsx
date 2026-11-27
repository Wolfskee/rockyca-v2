import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CarForm } from "@/components/admin/CarForm";

export default function AdminNewCarPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/cars"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vehicles
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Add New Vehicle</h1>
      <CarForm />
    </div>
  );
}
