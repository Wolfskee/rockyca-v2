import {
  CarType,
  Drivetrain,
  FuelType,
  InventoryStatus,
  Transmission,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCarDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(100)
  make!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage!: number;

  @IsString()
  @MaxLength(50)
  stockNumber!: string;

  @IsString()
  @Length(5, 17)
  vin!: string;

  @IsOptional()
  @IsEnum(CarType)
  type?: CarType | null;

  @IsEnum(Transmission)
  transmission!: Transmission;

  @IsEnum(FuelType)
  fuel!: FuelType;

  @IsEnum(Drivetrain)
  drivetrain!: Drivetrain;

  @IsString()
  @MaxLength(100)
  engine!: string;

  @IsString()
  @MaxLength(20)
  cylinders!: string;

  @IsString()
  @MaxLength(50)
  color!: string;

  @IsString()
  @MaxLength(50)
  interiorColor!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  doors!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxPassengers!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  carfaxKey?: string | null;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  carfaxUrl?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}

export class UpdateCarDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  make?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  stockNumber?: string;

  @IsOptional()
  @IsString()
  @Length(5, 17)
  vin?: string;

  @IsOptional()
  @IsEnum(CarType)
  type?: CarType | null;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsEnum(FuelType)
  fuel?: FuelType;

  @IsOptional()
  @IsEnum(Drivetrain)
  drivetrain?: Drivetrain;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  engine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cylinders?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  interiorColor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  doors?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxPassengers?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  carfaxKey?: string | null;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  carfaxUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}

export class ListCarsQueryDto {
  @IsOptional()
  @IsEnum(CarType)
  type?: CarType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}

export class AdminListCarsQueryDto extends ListCarsQueryDto {
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AttachVehicleImageDto {
  @IsString()
  @MaxLength(500)
  s3Key!: string;

  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  url!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
