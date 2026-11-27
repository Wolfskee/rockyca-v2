import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ALLOWED_CONTACT_SUBJECTS = [
  'Vehicle Inquiry',
  'Schedule Viewing',
  'General Question',
] as const;

export class CreateContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsIn(ALLOWED_CONTACT_SUBJECTS)
  subject!: (typeof ALLOWED_CONTACT_SUBJECTS)[number];

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;

  // Honeypot field: must remain empty for legitimate human submissions
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  // Client timestamp when the form rendered (ms epoch) for fill-duration check
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  formLoadedAt?: number;
}

export class ListInquiriesQueryDto {
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
  limit?: number = 20;
}

export class MarkInquiryReadDto {
  @IsBoolean()
  isRead!: boolean;
}
