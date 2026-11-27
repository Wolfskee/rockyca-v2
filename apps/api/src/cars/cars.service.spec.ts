import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryStatus } from '@prisma/client';
import { CarsService } from './cars.service';

describe('CarsService', () => {
  const mockS3 = {
    isManagedKey: jest.fn((key: string) => key.startsWith('vehicles/')),
    deleteObject: jest.fn<any>().mockResolvedValue(undefined),
    deleteObjects: jest.fn<any>().mockResolvedValue(0),
  };

  function createPrismaMock() {
    const tx: Record<string, any> = {
      car: {
        findUnique: jest.fn<any>(),
        update: jest.fn<any>(),
      },
      vehicleImage: {
        deleteMany: jest.fn<any>(),
        findFirst: jest.fn<any>(),
        updateMany: jest.fn<any>(),
        create: jest.fn<any>(),
      },
    };
    return {
      tx,
      prisma: {
        car: {
          findMany: jest.fn<any>(),
          findFirst: jest.fn<any>(),
          findUnique: jest.fn<any>(),
          count: jest.fn<any>(),
          delete: jest.fn<any>(),
        },
        $transaction: jest.fn<any>((arg: any) =>
          typeof arg === 'function' ? arg(tx) : Promise.all(arg),
        ),
      },
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('excludes sold_out vehicles from public detail lookup (returns 404)', async () => {
    const { prisma } = createPrismaMock();
    prisma.car.findFirst.mockResolvedValue(null);

    const service = new CarsService(prisma as any, mockS3 as any);

    await expect(service.findPublicById(42)).rejects.toThrow(NotFoundException);
    expect(prisma.car.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42, status: InventoryStatus.in_stock },
      }),
    );
  });

  it('deletes all vehicle images and Carfax PDF from DB and S3 when marked sold_out', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.car.findUnique.mockResolvedValue({
      id: 7,
      status: InventoryStatus.in_stock,
      carfaxKey: 'carfax/report-7.pdf',
      carfaxUrl: 'https://bucket.s3.amazonaws.com/carfax/report-7.pdf',
      images: [
        { id: 1, s3Key: 'vehicles/cars/img-1.jpg', isPrimary: true },
        { id: 2, s3Key: 'vehicles/cars/img-2.jpg', isPrimary: false },
      ],
    });
    tx.car.update.mockResolvedValue({
      id: 7,
      status: InventoryStatus.sold_out,
      price: '25000.00',
      carfaxKey: null,
      carfaxUrl: null,
      images: [],
    });

    const service = new CarsService(prisma as any, mockS3 as any);
    const result = await service.update(7, { status: InventoryStatus.sold_out });

    expect(tx.vehicleImage.deleteMany).toHaveBeenCalledWith({
      where: { carId: 7 },
    });
    expect(tx.car.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InventoryStatus.sold_out,
          carfaxKey: null,
          carfaxUrl: null,
        }),
      }),
    );
    expect(mockS3.deleteObjects).toHaveBeenCalledWith([
      'vehicles/cars/img-1.jpg',
      'vehicles/cars/img-2.jpg',
      'carfax/report-7.pdf',
    ]);
    expect(result.images).toEqual([]);
    expect(result.carfaxUrl).toBeNull();
  });

  it('rejects attaching images to a sold_out vehicle', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.car.findUnique.mockResolvedValue({
      id: 9,
      status: InventoryStatus.sold_out,
    });

    const service = new CarsService(prisma as any, mockS3 as any);

    await expect(
      service.addImage(9, {
        s3Key: 'vehicles/cars/new.jpg',
        url: 'https://bucket.s3.amazonaws.com/vehicles/cars/new.jpg',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
