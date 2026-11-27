import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { InventoryStatus } from '@prisma/client';
import { RampsService } from './ramps.service';

describe('RampsService', () => {
  const mockS3 = {
    isManagedKey: jest.fn((key: string) => key.startsWith('vehicles/')),
    deleteObject: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    deleteObjects: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  };

  function createPrismaMock() {
    const tx: Record<string, any> = {
      loadingRamp: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      vehicleImage: {
        deleteMany: jest.fn(),
      },
    };
    return {
      tx,
      prisma: {
        loadingRamp: {
          findFirst: jest.fn<any>(),
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

  it('returns 404 for sold_out loading ramps on public detail lookup', async () => {
    const { prisma } = createPrismaMock();
    prisma.loadingRamp.findFirst.mockResolvedValue(null);

    const service = new RampsService(prisma as any, mockS3 as any);

    await expect(service.findPublicById(3)).rejects.toThrow(NotFoundException);
    expect(prisma.loadingRamp.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, status: InventoryStatus.in_stock },
      }),
    );
  });

  it('deletes all ramp images from DB and S3 when marked sold_out', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.loadingRamp.findUnique.mockResolvedValue({
      id: 3,
      status: InventoryStatus.in_stock,
      images: [
        { id: 10, s3Key: 'vehicles/ramps/ramp-a.jpg', isPrimary: true },
        { id: 11, s3Key: 'vehicles/ramps/ramp-b.jpg', isPrimary: false },
      ],
    });
    tx.loadingRamp.update.mockResolvedValue({
      id: 3,
      status: InventoryStatus.sold_out,
      length: null,
      width: null,
      height: null,
      weight: null,
      capacity: null,
      price: '1200.00',
      images: [],
    });

    const service = new RampsService(prisma as any, mockS3 as any);
    await service.update(3, { status: InventoryStatus.sold_out });

    expect(tx.vehicleImage.deleteMany).toHaveBeenCalledWith({
      where: { rampId: 3 },
    });
    expect(mockS3.deleteObjects).toHaveBeenCalledWith([
      'vehicles/ramps/ramp-a.jpg',
      'vehicles/ramps/ramp-b.jpg',
    ]);
  });
});
