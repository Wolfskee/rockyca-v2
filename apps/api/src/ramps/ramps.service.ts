import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryStatus, Prisma } from '@prisma/client';
import { AttachVehicleImageDto } from '../cars/cars.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import {
  AdminListRampsQueryDto,
  CreateRampDto,
  ListRampsQueryDto,
  UpdateRampDto,
} from './ramps.dto';

const IMAGE_ORDER: Prisma.VehicleImageOrderByWithRelationInput[] = [
  { isPrimary: 'desc' },
  { sortOrder: 'asc' },
  { createdAt: 'desc' },
];

type RampWithImages = Prisma.LoadingRampGetPayload<{ include: { images: true } }>;

export function serializeRamp(ramp: RampWithImages) {
  const primaryImage =
    ramp.images.find((img) => img.isPrimary) ?? ramp.images[0] ?? null;

  return {
    ...ramp,
    length: ramp.length !== null ? Number(ramp.length) : null,
    width: ramp.width !== null ? Number(ramp.width) : null,
    height: ramp.height !== null ? Number(ramp.height) : null,
    weight: ramp.weight !== null ? Number(ramp.weight) : null,
    capacity: ramp.capacity !== null ? Number(ramp.capacity) : null,
    price: Number(ramp.price),
    primaryImage,
  };
}

@Injectable()
export class RampsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async listPublic(query: ListRampsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: Prisma.LoadingRampWhereInput = {
      status: InventoryStatus.in_stock,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.loadingRamp.findMany({
        where,
        include: { images: { orderBy: IMAGE_ORDER } },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loadingRamp.count({ where }),
    ]);

    return {
      items: items.map(serializeRamp),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findPublicById(id: number) {
    const ramp = await this.prisma.loadingRamp.findFirst({
      where: {
        id,
        status: InventoryStatus.in_stock,
      },
      include: { images: { orderBy: IMAGE_ORDER } },
    });

    if (!ramp) {
      throw new NotFoundException('Loading ramp not found');
    }

    return serializeRamp(ramp);
  }

  async listAdmin(query: AdminListRampsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.LoadingRampWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { stockNumber: { contains: search, mode: 'insensitive' } },
              { material: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.loadingRamp.findMany({
        where,
        include: { images: { orderBy: IMAGE_ORDER } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loadingRamp.count({ where }),
    ]);

    return {
      items: items.map(serializeRamp),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findAdminById(id: number) {
    const ramp = await this.prisma.loadingRamp.findUnique({
      where: { id },
      include: { images: { orderBy: IMAGE_ORDER } },
    });

    if (!ramp) {
      throw new NotFoundException('Loading ramp not found');
    }

    return serializeRamp(ramp);
  }

  async create(dto: CreateRampDto) {
    try {
      const ramp = await this.prisma.loadingRamp.create({
        data: {
          stockNumber: dto.stockNumber.trim(),
          length: dto.length ?? null,
          width: dto.width ?? null,
          height: dto.height ?? null,
          weight: dto.weight ?? null,
          capacity: dto.capacity ?? null,
          material: dto.material?.trim() || null,
          description: dto.description,
          price: dto.price,
          status: dto.status ?? InventoryStatus.in_stock,
        },
        include: { images: { orderBy: IMAGE_ORDER } },
      });

      return serializeRamp(ramp);
    } catch (error) {
      this.rethrowPrismaConflict(error);
    }
  }

  async update(id: number, dto: UpdateRampDto) {
    const keysToDelete: string[] = [];

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.loadingRamp.findUnique({
          where: { id },
          include: { images: true },
        });

        if (!existing) {
          throw new NotFoundException('Loading ramp not found');
        }

        const nextStatus = dto.status ?? existing.status;
        if (nextStatus === InventoryStatus.sold_out && existing.images.length > 0) {
          for (const img of existing.images) {
            keysToDelete.push(img.s3Key);
          }
          await tx.vehicleImage.deleteMany({ where: { rampId: id } });
        }

        return tx.loadingRamp.update({
          where: { id },
          data: {
            ...(dto.stockNumber !== undefined
              ? { stockNumber: dto.stockNumber.trim() }
              : {}),
            ...(dto.length !== undefined ? { length: dto.length } : {}),
            ...(dto.width !== undefined ? { width: dto.width } : {}),
            ...(dto.height !== undefined ? { height: dto.height } : {}),
            ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
            ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
            ...(dto.material !== undefined
              ? { material: dto.material?.trim() || null }
              : {}),
            ...(dto.description !== undefined
              ? { description: dto.description }
              : {}),
            ...(dto.price !== undefined ? { price: dto.price } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
          },
          include: { images: { orderBy: IMAGE_ORDER } },
        });
      });

      if (keysToDelete.length > 0) {
        await this.s3Service.deleteObjects(keysToDelete);
      }

      return serializeRamp(updated);
    } catch (error) {
      this.rethrowPrismaConflict(error);
    }
  }

  async remove(id: number) {
    const existing = await this.prisma.loadingRamp.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('Loading ramp not found');
    }

    const keysToDelete = existing.images.map((img) => img.s3Key);

    await this.prisma.loadingRamp.delete({ where: { id } });

    if (keysToDelete.length > 0) {
      await this.s3Service.deleteObjects(keysToDelete);
    }

    return { ok: true, deletedS3Objects: keysToDelete.length };
  }

  async addImage(rampId: number, dto: AttachVehicleImageDto) {
    if (!this.s3Service.isManagedKey(dto.s3Key)) {
      throw new BadRequestException('Invalid S3 image key');
    }

    return this.prisma.$transaction(async (tx) => {
      const ramp = await tx.loadingRamp.findUnique({ where: { id: rampId } });
      if (!ramp) {
        throw new NotFoundException('Loading ramp not found');
      }
      if (ramp.status === InventoryStatus.sold_out) {
        throw new BadRequestException(
          'Cannot attach images to a sold_out ramp. Change status to in_stock first.',
        );
      }

      const existingPrimary = await tx.vehicleImage.findFirst({
        where: { rampId, isPrimary: true },
      });
      const shouldBePrimary = Boolean(dto.isPrimary) || !existingPrimary;

      if (shouldBePrimary) {
        await tx.vehicleImage.updateMany({
          where: { rampId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.vehicleImage.create({
        data: {
          rampId,
          s3Key: dto.s3Key,
          url: dto.url,
          isPrimary: shouldBePrimary,
        },
      });
    });
  }

  async setPrimaryImage(rampId: number, imageId: number) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.vehicleImage.findFirst({
        where: { id: imageId, rampId },
      });
      if (!target) {
        throw new NotFoundException('Image not found for this loading ramp');
      }

      await tx.vehicleImage.updateMany({
        where: { rampId, isPrimary: true },
        data: { isPrimary: false },
      });

      return tx.vehicleImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }

  async removeImage(rampId: number, imageId: number) {
    const deleted = await this.prisma.$transaction(async (tx) => {
      const target = await tx.vehicleImage.findFirst({
        where: { id: imageId, rampId },
      });
      if (!target) {
        throw new NotFoundException('Image not found for this loading ramp');
      }

      await tx.vehicleImage.delete({ where: { id: imageId } });

      if (target.isPrimary) {
        const nextImage = await tx.vehicleImage.findFirst({
          where: { rampId },
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
      throw new ConflictException(
        'A loading ramp with this stock number already exists.',
      );
    }
    throw error;
  }
}
