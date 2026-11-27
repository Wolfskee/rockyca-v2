export type InventoryStatus = "in_stock" | "sold_out";
export type Transmission = "auto" | "manual";
export type FuelType = "gas" | "diesel" | "electric" | "hybrid";
export type Drivetrain = "awd" | "fwd" | "rwd";
export type CarType = "sedan" | "suv" | "pickup";

export interface VehicleImage {
  id: number;
  carId: number | null;
  rampId: number | null;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Car {
  id: number;
  name: string;
  make: string;
  year: number;
  mileage: number;
  stockNumber: string;
  vin: string;
  type: CarType | null;
  transmission: Transmission;
  fuel: FuelType;
  drivetrain: Drivetrain;
  engine: string;
  cylinders: string;
  color: string;
  interiorColor: string;
  doors: number;
  maxPassengers: number;
  description: string;
  carfaxKey: string | null;
  carfaxUrl: string | null;
  price: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
  primaryImage: VehicleImage | null;
}

export interface LoadingRamp {
  id: number;
  stockNumber: string;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  capacity: number | null;
  material: string | null;
  description: string;
  price: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
  primaryImage: VehicleImage | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface InventorySummary {
  cars: Car[];
  ramps: LoadingRamp[];
  counts: {
    cars: number;
    ramps: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  ipAddress: string | null;
  isRead: boolean;
  createdAt: string;
}
