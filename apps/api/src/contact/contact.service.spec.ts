import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { ContactService } from './contact.service';

describe('ContactService anti-spam defenses', () => {
  const mockPrisma = {
    contactInquiry: {
      create: jest.fn(),
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

  it('silently drops honeypot bot submissions without saving or emailing', async () => {
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
  });
});
