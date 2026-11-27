import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateContactDto,
  ListInquiriesQueryDto,
  MarkInquiryReadDto,
} from './contact.dto';
import { ContactService } from './contact.service';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    short: { ttl: 60_000, limit: 2 },
    long: { ttl: 3_600_000, limit: 5 },
  })
  submit(@Body() dto: CreateContactDto, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() ||
      req.ip;
    return this.contactService.submit(dto, clientIp);
  }

  @Get('admin/inquiries')
  @UseGuards(JwtAuthGuard)
  listInquiries(@Query() query: ListInquiriesQueryDto) {
    return this.contactService.listInquiries(query);
  }

  @Patch('admin/inquiries/:id/read')
  @UseGuards(JwtAuthGuard)
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkInquiryReadDto,
  ) {
    return this.contactService.markRead(id, dto.isRead);
  }
}
