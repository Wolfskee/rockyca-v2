import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, type MessageEvent } from '@nestjs/common';
import { filter, firstValueFrom } from 'rxjs';
import { ContactService } from './contact.service';

describe('ContactService anti-spam defenses & live updates', () => {
  const mockPrisma = {
    contactInquiry: {
      create: jest.fn<any>(),
      count: jest.fn<any>(),
      findUnique: jest.fn<any>(),
      update: jest.fn<any>(),
    },
  };

  function createService(env: Record<string, string> = {}) {
    const config = {
      get: jest.fn((key: string) => env[key]),
    };
    return new ContactService(mockPrisma as any, config as any);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('silently drops honeypot bot submissions without saving', async () => {
    const service = createService({ TURNSTILE_BYPASS: 'true', NODE_ENV: 'test' });
    const res = await service.submit({
      name: 'Bot Name',
      email: 'bot@example.com',
      subject: 'General Question',
      message: 'Buy cheap watches right now!',
      website: 'https://spam.example.com',
    });

    expect(res.ok).toBe(true);
    expect(mockPrisma.contactInquiry.create).not.toHaveBeenCalled();
    service.onModuleDestroy();
  });

  it('rejects forms submitted faster than 2.5 seconds', async () => {
    const service = createService({ TURNSTILE_BYPASS: 'true', NODE_ENV: 'test' });

    await expect(
      service.submit({
        name: 'Fast Bot',
        email: 'fast@example.com',
        subject: 'Vehicle Inquiry',
        message: 'Interested in the Toyota Camry listed today.',
        formLoadedAt: Date.now() - 500,
      }),
    ).rejects.toThrow(BadRequestException);
    service.onModuleDestroy();
  });

  it('rejects gibberish random strings and excessive links', () => {
    const service = createService();

    expect(() =>
      service.assertCleanContent(
        'Normal Name',
        'Check https://spam1.com and https://spam2.com now!',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      service.assertCleanContent(
        'Normal Name',
        'xK9mQp2Lz8Vw4Rt7Yb1Nc6Df3Hj5Ks0MnPqRsTuVwXyZ',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      service.assertCleanContent(
        'Eric Shu',
        'Hi, I would like to schedule a viewing for the 2022 RAV4 this Saturday.',
      ),
    ).not.toThrow();
    service.onModuleDestroy();
  });

  it('requires turnstile token when bypass is disabled', async () => {
    const service = createService({
      TURNSTILE_BYPASS: 'false',
      TURNSTILE_SECRET_KEY: 'test-secret',
      NODE_ENV: 'production',
    });

    await expect(service.verifyTurnstile('')).rejects.toThrow(
      BadRequestException,
    );
    service.onModuleDestroy();
  });

  it('saves verified submission to DB without sending email and emits SSE event', async () => {
    const service = createService({ TURNSTILE_BYPASS: 'true', NODE_ENV: 'test' });
    const createdInquiry = {
      id: 42,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '204-555-0100',
      subject: 'Vehicle Inquiry',
      message: 'Hi, is the 2023 Honda CR-V still available for viewing?',
      ipAddress: '127.0.0.1',
      isRead: false,
      createdAt: new Date('2026-11-27T07:00:00.000Z'),
    };

    mockPrisma.contactInquiry.create.mockResolvedValue(createdInquiry);
    mockPrisma.contactInquiry.count.mockResolvedValue(1);

    const eventPromise = firstValueFrom(
      service
        .streamInquiries()
        .pipe(filter((evt: MessageEvent) => evt.type === 'inquiry.created')),
    );

    const res = await service.submit(
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '204-555-0100',
        subject: 'Vehicle Inquiry',
        message: 'Hi, is the 2023 Honda CR-V still available for viewing?',
        formLoadedAt: Date.now() - 5000,
      },
      '127.0.0.1',
    );

    const event = await eventPromise;

    expect(res.ok).toBe(true);
    expect(res.id).toBe(42);
    expect(mockPrisma.contactInquiry.create).toHaveBeenCalledTimes(1);
    expect(event.data).toEqual({
      type: 'inquiry.created',
      inquiry: createdInquiry,
      unreadCount: 1,
    });

    service.onModuleDestroy();
  });
});
