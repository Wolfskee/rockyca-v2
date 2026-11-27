import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import {
  AdminListCarsQueryDto,
  AttachVehicleImageDto,
  CreateCarDto,
  ListCarsQueryDto,
  UpdateCarDto,
} from './cars.dto';

const IMAGE_ORDER: Prisma.VehicleImageOrderByWithRelationInput[] = [
  { isPrimary: 'desc' },
  { sortOrder: 'asc' },
  { createdAt: 'desc' },
];

type CarWithImages = Prisma.CarGetPayload<{ include: { images: true } }>;

export function serializeCar(car: CarWithImages) {
  const primaryImage =
    car.images.find((img) => img.isPrimary) ?? car.images[0] ?? null;

  return {
    ...car,
    price: Number(car.price),
    primaryImage,
  };
}

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async listPublic(query: ListCarsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: Prisma.CarWhereInput = {
      status: InventoryStatus.in_stock,
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.car.findMany({
        where,
        include: { images: { orderBy: IMAGE_ORDER } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      items: items.map(serializeCar),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findPublicById(id: number) {
    const car = await this.prisma.car.findFirst({
      where: {
        id,
        status: InventoryStatus.in_stock,
      },
      include: { images: { orderBy: IMAGE_ORDER } },
    });

    if (!car) {
      throw new NotFoundException('Vehicle not found');
    }

    return serializeCar(car);
  }

  async listAdmin(query: AdminListCarsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.CarWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { make: { contains: search, mode: 'insensitive' } },
              { stockNumber: { contains: search, mode: 'insensitive' } },
              { vin: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.car.findMany({
        where,
        include: { images: { orderBy: IMAGE_ORDER } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.car.count({ where }),
    ]);

    return {
      items: items.map(serializeCar),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findAdminById(id: number) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { images: { orderBy: IMAGE_ORDER } },
    });

    if (!car) {
      throw new NotFoundException('Vehicle not found');
    }

    return serializeCar(car);
  }

  async create(dto: CreateCarDto) {
    const status = dto.status ?? InventoryStatus.in_stock;
    const isSoldOut = status === InventoryStatus.sold_out;

    try {
      const car = await this.prisma.car.create({
        data: {
          name: dto.name.trim(),
          make: dto.make.trim(),
          year: dto.year,
          mileage: dto.mileage,
          stockNumber: dto.stockNumber.trim(),
          vin: dto.vin.trim().toUpperCase(),
          type: dto.type ?? null,
          transmission: dto.transmission,
          fuel: dto.fuel,
          drivetrain: dto.drivetrain,
          engine: dto.engine.trim(),
          cylinders: dto.cylinders.trim(),
          color: dto.color.trim(),
          interiorColor: dto.interiorColor.trim(),
          doors: dto.doors,
          maxPassengers: dto.maxPassengers,
          description: dto.description,
          carfaxKey: isSoldOut ? null : (dto.carfaxKey ?? null),
          carfaxUrl: isSoldOut ? null : (dto.carfaxUrl ?? null),
          price: dto.price,
          status,
        },
        include: { images: { orderBy: IMAGE_ORDER } },
      });

      if (isSoldOut && dto.carfaxKey) {
        await this.s3Service.deleteObject(dto.carfaxKey);
      }

      return serializeCar(car);
    } catch (error) {
      this.rethrowPrismaConflict(error);
    }
  }

  async update(id: number, dto: UpdateCarDto) {
    const keysToDelete: string[] = [];

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.car.findUnique({
          where: { id },
          include: { images: true },
        });

        if (!existing) {
          throw new NotFoundException('Vehicle not found');
        }

        const nextStatus = dto.status ?? existing.status;
        const becomingOrStayingSoldOut = nextStatus === InventoryStatus.sold_out;

        if (becomingOrStayingSoldOut) {
          // Business rule: when a car is sold_out, remove all its images & Carfax PDF from DB and S3
          for (const img of existing.images) {
            keysToDelete.push(img.s3Key);
          }
          if (existing.carfaxKey) {
            keysToDelete.push(existing.carfaxKey);
          }
          if (dto.carfaxKey && dto.carfaxKey !== existing.carfaxKey) {
            keysToDelete.push(dto.carfaxKey);
          }

          if (existing.images.length > 0) {
            await tx.vehicleImage.deleteMany({ where: { carId: id } });
          }
        } else if (
          dto.carfaxKey !== undefined &&
          existing.carfaxKey &&
          dto.carfaxKey !== existing.carfaxKey
        ) {
          // Carfax PDF was replaced or explicitly cleared
          keysToDelete.push(existing.carfaxKey);
        }

        return tx.car.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.make !== undefined ? { make: dto.make.trim() } : {}),
            ...(dto.year !== undefined ? { year: dto.year } : {}),
            ...(dto.mileage !== undefined ? { mileage: dto.mileage } : {}),
            ...(dto.stockNumber !== undefined
              ? { stockNumber: dto.stockNumber.trim() }
              : {}),
            ...(dto.vin !== undefined
              ? { vin: dto.vin.trim().toUpperCase() }
              : {}),
            ...(dto.type !== undefined ? { type: dto.type } : {}),
            ...(dto.transmission !== undefined
              ? { transmission: dto.transmission }
              : {}),
            ...(dto.fuel !== undefined ? { fuel: dto.fuel } : {}),
            ...(dto.drivetrain !== undefined
              ? { drivetrain: dto.drivetrain }
              : {}),
            ...(dto.engine !== undefined ? { engine: dto.engine.trim() } : {}),
            ...(dto.cylinders !== undefined
              ? { cylinders: dto.cylinders.trim() }
              : {}),
            ...(dto.color !== undefined ? { color: dto.color.trim() } : {}),
            ...(dto.interiorColor !== undefined
              ? { interiorColor: dto.interiorColor.trim() }
              : {}),
            ...(dto.doors !== undefined ? { doors: dto.doors } : {}),
            ...(dto.maxPassengers !== undefined
              ? { maxPassengers: dto.maxPassengers }
              : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.price !== undefined ? { price: dto.price } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(becomingOrStayingSoldOut
              ? { carfaxKey: null, carfaxUrl: null }
              : {
                  ...(dto.carfaxKey !== undefined
                    ? { carfaxKey: dto.carfaxKey }
                    : {}),
                  ...(dto.carfaxUrl !== undefined
                    ? { carfaxUrl: dto.carfaxUrl }
                    : {}),
                }),
          },
          include: { images: { orderBy: IMAGE_ORDER } },
        });
      });

      // Delete S3 objects strictly AFTER DB transaction commits
      if (keysToDelete.length > 0) {
        await this.s3Service.deleteObjects(keysToDelete);
      }

      return serializeCar(updated);
    } catch (error) {
      this.rethrowPrismaConflict(error);
    }
  }

  async remove(id: number) {
    const existing = await this.prisma.car.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Vehicle not found');
    }

    const keysToDelete = [
      ...existing.images.map((img) => img.s3Key),
      ...(existing.carfaxKey ? [existing.carfaxKey] : []),
    ];

    await this.prisma.car.delete({ where: { id } });

    if (keysToDelete.length > 0) {
      await this.s3Service.deleteObjects(keysToDelete);
    }

    return { ok: true, deletedS3Objects: keysToDelete.length };
  }

  async addImage(carId: number, dto: AttachVehicleImageDto) {
    if (!this.s3Service.isManagedKey(dto.s3Key)) {
      throw new BadRequestException('Invalid S3 image key');
    }

    return this.prisma.$transaction(async (tx) => {
      const car = await tx.car.findUnique({ where: { id: carId } });
      if (!car) {
        throw new NotFoundException('Vehicle not found');
      }
      if (car.status === InventoryStatus.sold_out) {
        throw new BadRequestException(
          'Cannot attach images to a sold_out vehicle. Change status to in_stock first.',
        );
      }

      const existingPrimary = await tx.vehicleImage.findFirst({
        where: { carId, isPrimary: true },
      });
      const shouldBePrimary = Boolean(dto.isPrimary) || !existingPrimary;

      if (shouldBePrimary) {
        await tx.vehicleImage.updateMany({
          where: { carId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.vehicleImage.create({
        data: {
          carId,
          s3Key: dto.s3Key,
          url: dto.url,
          isPrimary: shouldBePrimary,
        },
      });
    });
  }

  async setPrimaryImage(carId: number, imageId: number) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.vehicleImage.findFirst({
        where: { id: imageId, carId },
      });
      if (!target) {
        throw new NotFoundException('Image not found for this vehicle');
      }

      await tx.vehicleImage.updateMany({
        where: { carId, isPrimary: true },
        data: { isPrimary: false },
      });

      return tx.vehicleImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }

  async removeImage(carId: number, imageId: number) {
    const deleted = await this.prisma.$transaction(async (tx) => {
      const target = await tx.vehicleImage.findFirst({
        where: { id: imageId, carId },
      });
      if (!target) {
        throw new NotFoundException('Image not found for this vehicle');
      }

      await tx.vehicleImage.delete({ where: { id: imageId } });

      if (target.isPrimary) {
        const nextImage = await tx.vehicleImage.findFirst({
          where: { carId },
          orderBy: { createdAt: 'desc' },
        });
        if (nextImage) {
          await tx.vehicleImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }

      return target;
    });

    await this.s3Service.deleteObject(deleted.s3Key);
    return { ok: true };
  }

  private rethrowPrismaConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : 'unique field';
      throw new ConflictException(`A vehicle with this ${target} already exists.`);
    }
    throw error;
  }
}
