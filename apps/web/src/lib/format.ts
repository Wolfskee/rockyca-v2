import type { CarType, Drivetrain, FuelType, Transmission } from "./types";

const intFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 0,
});

export function formatCurrency(price: number): string {
  return `$${intFormatter.format(Math.round(price))}`;
}

export function formatMileage(mileage: number): string {
  return `${intFormatter.format(Math.round(mileage))} KM`;
}

export function mmToInches(mm: number): string {
  return (mm / 25.4).toFixed(2);
}

export function kgToLbs(kg: number): string {
  return (kg * 2.20462).toFixed(2);
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  auto: "Automatic",
  manual: "Manual",
};

export const FUEL_LABELS: Record<FuelType, string> = {
  gas: "Gasoline",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
};

export const DRIVETRAIN_LABELS: Record<Drivetrain, string> = {
  awd: "All-Wheel Drive",
  fwd: "Front-Wheel Drive",
  rwd: "Rear-Wheel Drive",
};

export const CAR_TYPE_LABELS: Record<CarType, string> = {
  sedan: "Sedan",
  suv: "SUV",
  pickup: "Pickup",
};
