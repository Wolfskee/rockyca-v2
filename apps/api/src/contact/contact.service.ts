import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, ListInquiriesQueryDto } from './contact.dto';

const MIN_FILL_TIME_MS = 2500;
const URL_REGEX = /(https?:\/\/|www\.)\S+/gi;
const LONG_GIBBERISH_TOKEN_REGEX = /[A-Za-z0-9]{35,}/;

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async submit(dto: CreateContactDto, clientIp?: string) {
    // Layer 1: Honeypot silent drop — bots filling hidden field get a fake 200 without sending mail
    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn(
        `Blocked contact spam via honeypot from IP=${clientIp ?? 'unknown'}`,
      );
      return {
        ok: true,
        message: 'Your message has been sent. Thank you for contacting us!',
      };
    }

    // Layer 2: Fill duration check (< 2.5s is almost certainly automated)
    if (typeof dto.formLoadedAt === 'number') {
      const elapsed = Date.now() - dto.formLoadedAt;
      if (elapsed < MIN_FILL_TIME_MS || elapsed < 0) {
        this.logger.warn(
          `Blocked contact submission due to suspicious fill time (${elapsed}ms) from IP=${clientIp ?? 'unknown'}`,
        );
        throw new BadRequestException(
          'Please take a moment to review your message before submitting.',
        );
      }
    }

    // Layer 3: Cloudflare Turnstile server-side human verification
    await this.verifyTurnstile(dto.turnstileToken, clientIp);

    // Layer 4: Content & spam pattern filtering
    this.assertCleanContent(dto.name, dto.message);

    const name = dto.name.trim();
    const email = dto.email.trim();
    const phone = dto.phone?.trim() || null;
    const subject = dto.subject;
    const message = dto.message.trim();

    // Persist verified inquiry in PostgreSQL so leads are never lost
    const inquiry = await this.prisma.contactInquiry.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        ipAddress: clientIp ?? null,
      },
    });

    // Send notification email via SMTP
    await this.sendNotificationEmail({
      name,
      email,
      phone: phone ?? 'N/A',
      subject,
      message,
    });

    return {
      ok: true,
      id: inquiry.id,
      message: 'Your message has been sent. Thank you for contacting us!',
    };
  }

  async verifyTurnstile(token?: string, clientIp?: string): Promise<void> {
    const bypass =
      this.configService.get<string>('TURNSTILE_BYPASS') === 'true' &&
      this.configService.get<string>('NODE_ENV') !== 'production';

    if (bypass) {
      return;
    }

    const secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('TURNSTILE_SECRET_KEY is not configured');
      throw new InternalServerErrorException(
        'Human verification service is not configured.',
      );
    }

    if (!token || token.trim().length === 0) {
      throw new BadRequestException(
        'Please complete the human verification check before submitting.',
      );
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token.trim());
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    let data: TurnstileVerifyResponse;
    try {
      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        },
      );
      data = (await response.json()) as TurnstileVerifyResponse;
    } catch (error) {
      this.logger.error(
        `Turnstile verification network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(
        'Could not verify human check. Please try again.',
      );
    }

    if (!data.success) {
      this.logger.warn(
        `Turnstile rejected submission: ${JSON.stringify(data['error-codes'] ?? [])}`,
      );
      throw new BadRequestException(
        'Human verification failed. Please refresh and try again.',
      );
    }
  }

  assertCleanContent(name: string, message: string): void {
    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (/[\r\n]/.test(cleanName)) {
      throw new BadRequestException('Invalid name format.');
    }

    const urls = cleanMessage.match(URL_REGEX) ?? [];
    if (urls.length > 1) {
      throw new BadRequestException(
        'Please avoid including multiple links in your message.',
      );
    }

    // Remove any single valid URL before checking for long gibberish strings
    const messageWithoutUrls = cleanMessage.replace(URL_REGEX, ' ');
    if (
      LONG_GIBBERISH_TOKEN_REGEX.test(cleanName) ||
      LONG_GIBBERISH_TOKEN_REGEX.test(messageWithoutUrls)
    ) {
      throw new BadRequestException(
        'Your message appears to contain unreadable text. Please revise and try again.',
      );
    }

    // Reject messages dominated by non-letter/non-digit symbols (supports Unicode letters including CJK)
    const meaningfulChars = (
      messageWithoutUrls.match(/[\p{L}\p{N}]/gu) ?? []
    ).length;
    if (meaningfulChars < 5) {
      throw new BadRequestException(
        'Please enter a clear message describing your inquiry.',
      );
    }
  }

  private async sendNotificationEmail(payload: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP credentials are not configured; inquiry saved to DB without sending email.',
      );
      return;
    }

    const port = Number(this.configService.get<string>('SMTP_PORT') || 465);
    const secure =
      this.configService.get<string>('SMTP_SECURE') !== 'false' && port === 465;
    const fromEmail =
      this.configService.get<string>('CONTACT_FROM_EMAIL') || user;
    const recipient =
      this.configService.get<string>('CONTACT_RECIPIENT_EMAIL') ||
      'sales@rockyca.com';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: recipient,
        replyTo: payload.email,
        subject: `${payload.subject} - ${payload.name}`,
        text: [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Phone: ${payload.phone}`,
          `Subject: ${payload.subject}`,
          '',
          'Message:',
          payload.message,
        ].join('\n'),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send contact email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'We received your message, but failed to deliver the email notification. Please call us at +1 (204)-256-5277.',
      );
    }
  }

  async listInquiries(query: ListInquiriesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.contactInquiry.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contactInquiry.count(),
      this.prisma.contactInquiry.count({ where: { isRead: false } }),
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async markRead(id: number, isRead: boolean) {
    const existing = await this.prisma.contactInquiry.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Inquiry not found');
    }

    return this.prisma.contactInquiry.update({
      where: { id },
      data: { isRead },
    });
  }
}
