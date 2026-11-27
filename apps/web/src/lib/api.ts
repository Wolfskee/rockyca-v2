import type {
  AdminUser,
  Car,
  CarType,
  ContactInquiry,
  InventorySummary,
  LoadingRamp,
  PaginatedResponse,
  VehicleImage,
} from "./types";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000/api"
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (Array.isArray(err?.message)) {
        message = err.message.join("; ");
      } else if (typeof err?.message === "string") {
        message = err.message;
      }
    } catch {
      // ignore non-JSON body
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

// Public API calls (used by Server Components with no-store for fresh sold_out removal)
export async function fetchInventorySummary(): Promise<InventorySummary> {
  return apiFetch<InventorySummary>("/inventory/summary", {
    cache: "no-store",
  });
}

export async function fetchPublicCars(params?: {
  type?: CarType;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Car>> {
  const search = new URLSearchParams();
  if (params?.type) search.set("type", params.type);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<PaginatedResponse<Car>>(`/cars${qs}`, { cache: "no-store" });
}

export async function fetchPublicCarById(id: number): Promise<Car | null> {
  try {
    return await apiFetch<Car>(`/cars/${id}`, { cache: "no-store" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function fetchPublicRamps(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<LoadingRamp>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<PaginatedResponse<LoadingRamp>>(`/ramps${qs}`, {
    cache: "no-store",
  });
}

export async function fetchPublicRampById(
  id: number,
): Promise<LoadingRamp | null> {
  try {
    return await apiFetch<LoadingRamp>(`/ramps/${id}`, { cache: "no-store" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  turnstileToken?: string;
  website?: string;
  formLoadedAt: number;
}): Promise<{ ok: boolean; message: string }> {
  return apiFetch("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Admin API calls
export async function adminLogin(email: string, password: string) {
  return apiFetch<{ user: AdminUser; accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function adminLogout() {
  return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function adminGetMe() {
  return apiFetch<{ user: AdminUser }>("/auth/me", { cache: "no-store" });
}

export async function adminListCars(params?: {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.type) search.set("type", params.type);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  const qs = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<PaginatedResponse<Car>>(`/admin/cars${qs}`, {
    cache: "no-store",
  });
}

export async function adminGetCar(id: number) {
  return apiFetch<Car>(`/admin/cars/${id}`, { cache: "no-store" });
}

export async function adminCreateCar(data: Record<string, unknown>) {
  return apiFetch<Car>("/admin/cars", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCar(
  id: number,
  data: Record<string, unknown>,
) {
  return apiFetch<Car>(`/admin/cars/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCar(id: number) {
  return apiFetch<{ ok: boolean }>(`/admin/cars/${id}`, { method: "DELETE" });
}

export async function adminAttachCarImage(
  carId: number,
  payload: { s3Key: string; url: string; isPrimary?: boolean },
) {
  return apiFetch<VehicleImage>(`/admin/cars/${carId}/images`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminSetCarPrimaryImage(carId: number, imageId: number) {
  return apiFetch<VehicleImage>(
    `/admin/cars/${carId}/images/${imageId}/primary`,
    { method: "PATCH" },
  );
}

export async function adminDeleteCarImage(carId: number, imageId: number) {
  return apiFetch<{ ok: boolean }>(`/admin/cars/${carId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function adminListRamps(params?: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  const qs = search.toString() ? `?${search.toString()}` : "";
  return apiFetch<PaginatedResponse<LoadingRamp>>(`/admin/ramps${qs}`, {
    cache: "no-store",
  });
}

export async function adminGetRamp(id: number) {
  return apiFetch<LoadingRamp>(`/admin/ramps/${id}`, { cache: "no-store" });
}

export async function adminCreateRamp(data: Record<string, unknown>) {
  return apiFetch<LoadingRamp>("/admin/ramps", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateRamp(
  id: number,
  data: Record<string, unknown>,
) {
  return apiFetch<LoadingRamp>(`/admin/ramps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteRamp(id: number) {
  return apiFetch<{ ok: boolean }>(`/admin/ramps/${id}`, { method: "DELETE" });
}

export async function adminAttachRampImage(
  rampId: number,
  payload: { s3Key: string; url: string; isPrimary?: boolean },
) {
  return apiFetch<VehicleImage>(`/admin/ramps/${rampId}/images`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminSetRampPrimaryImage(
  rampId: number,
  imageId: number,
) {
  return apiFetch<VehicleImage>(
    `/admin/ramps/${rampId}/images/${imageId}/primary`,
    { method: "PATCH" },
  );
}

export async function adminDeleteRampImage(rampId: number, imageId: number) {
  return apiFetch<{ ok: boolean }>(`/admin/ramps/${rampId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function adminListInquiries(page = 1) {
  return apiFetch<
    PaginatedResponse<ContactInquiry> & { unreadCount: number }
  >(`/admin/inquiries?page=${page}`, { cache: "no-store" });
}

export async function adminMarkInquiryRead(id: number, isRead: boolean) {
  return apiFetch<ContactInquiry>(`/admin/inquiries/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ isRead }),
  });
}

export async function requestS3Presign(payload: {
  folder: "cars" | "ramps" | "carfax";
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  return apiFetch<{
    uploadUrl: string;
    s3Key: string;
    publicUrl: string;
    expiresIn: number;
  }>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadFileDirectToS3(
  file: File,
  folder: "cars" | "ramps" | "carfax",
): Promise<{ s3Key: string; publicUrl: string }> {
  const presign = await requestS3Presign({
    folder,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    fileSize: file.size,
  });

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Direct upload to S3 failed (${putRes.status})`);
  }

  return {
    s3Key: presign.s3Key,
    publicUrl: presign.publicUrl,
  };
}
