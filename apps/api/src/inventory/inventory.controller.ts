import { Controller, Get } from '@nestjs/common';
import { InventoryStatus } from '@prisma/client';
import { serializeCar } from '../cars/cars.service';
import { PrismaService } from '../prisma/prisma.service';
import { serializeRamp } from '../ramps/ramps.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async summary() {
    const [cars, ramps, totalCars, totalRamps] = await this.prisma.$transaction([
      this.prisma.car.findMany({
        where: { status: InventoryStatus.in_stock },
        include: {
          images: {
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' },
              { createdAt: 'desc' },
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.loadingRamp.findMany({
        where: { status: InventoryStatus.in_stock },
        include: {
          images: {
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' },
              { createdAt: 'desc' },
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.car.count({ where: { status: InventoryStatus.in_stock } }),
      this.prisma.loadingRamp.count({
        where: { status: InventoryStatus.in_stock },
      }),
    ]);

    return {
      cars: cars.map(serializeCar),
      ramps: ramps.map(serializeRamp),
      counts: {
        cars: totalCars,
        ramps: totalRamps,
      },
    };
  }
}
