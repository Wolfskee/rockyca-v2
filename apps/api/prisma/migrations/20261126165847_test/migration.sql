-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('in_stock', 'sold_out');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('gas', 'diesel', 'electric', 'hybrid');

-- CreateEnum
CREATE TYPE "Drivetrain" AS ENUM ('awd', 'fwd', 'rwd');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('sedan', 'suv', 'pickup');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "stock_number" VARCHAR(50) NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "type" "CarType",
    "transmission" "Transmission" NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "drivetrain" "Drivetrain" NOT NULL,
    "engine" VARCHAR(100) NOT NULL,
    "cylinders" VARCHAR(20) NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "interior_color" VARCHAR(50) NOT NULL,
    "doors" INTEGER NOT NULL,
    "max_passengers" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "carfax_key" VARCHAR(500),
    "carfax_url" VARCHAR(1000),
    "price" DECIMAL(10,2) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'in_stock',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loading_ramps" (
    "id" SERIAL NOT NULL,
    "stock_number" VARCHAR(50) NOT NULL,
    "length" DECIMAL(8,2),
    "width" DECIMAL(8,2),
    "height" DECIMAL(8,2),
    "weight" DECIMAL(8,2),
    "capacity" DECIMAL(8,2),
    "material" VARCHAR(100),
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'in_stock',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loading_ramps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" SERIAL NOT NULL,
    "car_id" INTEGER,
    "ramp_id" INTEGER,
    "s3_key" VARCHAR(500) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "subject" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "ip_address" VARCHAR(64),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cars_stock_number_key" ON "cars"("stock_number");

-- CreateIndex
CREATE UNIQUE INDEX "cars_vin_key" ON "cars"("vin");

-- CreateIndex
CREATE INDEX "cars_status_created_at_idx" ON "cars"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cars_status_type_created_at_idx" ON "cars"("status", "type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "loading_ramps_stock_number_key" ON "loading_ramps"("stock_number");

-- CreateIndex
CREATE INDEX "loading_ramps_status_created_at_idx" ON "loading_ramps"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_s3_key_key" ON "vehicle_images"("s3_key");

-- CreateIndex
CREATE INDEX "vehicle_images_car_id_is_primary_created_at_idx" ON "vehicle_images"("car_id", "is_primary", "created_at" DESC);

-- CreateIndex
CREATE INDEX "vehicle_images_ramp_id_is_primary_created_at_idx" ON "vehicle_images"("ramp_id", "is_primary", "created_at" DESC);

-- CreateIndex
CREATE INDEX "contact_inquiries_created_at_idx" ON "contact_inquiries"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_ramp_id_fkey" FOREIGN KEY ("ramp_id") REFERENCES "loading_ramps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
