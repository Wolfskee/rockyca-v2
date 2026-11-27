import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from './s3.service';
import { DeleteObjectDto, PresignUploadDto } from './uploads.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presign')
  presign(@Body() dto: PresignUploadDto) {
    return this.s3Service.createPresignedUpload(dto);
  }

  @Delete('object')
  async deleteObject(@Body() dto: DeleteObjectDto) {
    if (!this.s3Service.isManagedKey(dto.s3Key)) {
      throw new BadRequestException('Invalid S3 object key');
    }
    await this.s3Service.deleteObject(dto.s3Key);
    return { ok: true };
  }
}
