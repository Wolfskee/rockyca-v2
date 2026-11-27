import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { PresignUploadDto } from './uploads.dto';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/avif',
  'image/webp',
]);

const ALLOWED_IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.avif',
  '.webp',
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_CARFAX_BYTES = 20 * 1024 * 1024;

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl: string;
  private readonly endpoint?: string;
  private readonly forcePathStyle: boolean;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'ca-central-1';
    this.bucket =
      this.configService.get<string>('AWS_S3_BUCKET') || 'rockyca-inventory-media';
    this.publicBaseUrl = (
      this.configService.get<string>('S3_PUBLIC_BASE_URL') || ''
    ).replace(/\/+$/, '');
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || undefined;
    this.forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.client = new S3Client({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      forcePathStyle: this.forcePathStyle,
      // Prevent SDK v3.729+ automatic CRC32 checksum headers from breaking browser presigned PUTs on local S3 & AWS S3
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(accessKeyId && secretAccessKey
        ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
        : {}),
    });
  }

  async onModuleInit(): Promise<void> {
    // Only auto-provision bucket & public-read policy when using a local S3 endpoint (Docker S3)
    if (!this.endpoint) {
      return;
    }

    try {
      let bucketExists = true;
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      } catch {
        bucketExists = false;
      }

      if (!bucketExists) {
        await this.client.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
        this.logger.log(`Created local S3 bucket "${this.bucket}"`);
      }

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicReadInventoryMedia',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [
              `arn:aws:s3:::${this.bucket}/vehicles/*`,
              `arn:aws:s3:::${this.bucket}/carfax/*`,
            ],
          },
        ],
      };

      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify(policy),
        }),
      );
      this.logger.log(
        `Local S3 bucket "${this.bucket}" ready with public-read policy at ${this.endpoint}`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not auto-initialize local S3 bucket "${this.bucket}" at ${this.endpoint}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getPublicUrl(s3Key: string): string {
    const cleanKey = s3Key
      .replace(/^\/+/, '')
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${cleanKey}`;
    }
    if (this.endpoint && this.forcePathStyle) {
      return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${cleanKey}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${cleanKey}`;
  }

  isManagedKey(s3Key: string): boolean {
    return (
      typeof s3Key === 'string' &&
      !s3Key.includes('..') &&
      (s3Key.startsWith('vehicles/cars/') ||
        s3Key.startsWith('vehicles/ramps/') ||
        s3Key.startsWith('carfax/'))
    );
  }

  async createPresignedUpload(dto: PresignUploadDto) {
    const ext = path.extname(dto.fileName).toLowerCase();
    const mime = dto.contentType.toLowerCase().trim();

    if (dto.folder === 'carfax') {
      if (mime !== 'application/pdf' || ext !== '.pdf') {
        throw new BadRequestException('Carfax report must be a PDF file.');
      }
      if (dto.fileSize > MAX_CARFAX_BYTES) {
        throw new BadRequestException('Carfax PDF cannot exceed 20MB.');
      }
    } else {
      if (!ALLOWED_IMAGE_MIMES.has(mime) || !ALLOWED_IMAGE_EXTS.has(ext)) {
        throw new BadRequestException(
          'Unsupported image format. Allowed: JPG, JPEG, PNG, GIF, AVIF, WebP.',
        );
      }
      if (dto.fileSize > MAX_IMAGE_BYTES) {
        throw new BadRequestException('Image file cannot exceed 10MB.');
      }
    }

    const prefix =
      dto.folder === 'carfax' ? 'carfax' : `vehicles/${dto.folder}`;
    const s3Key = `${prefix}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: mime,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300,
    });

    return {
      uploadUrl,
      s3Key,
      publicUrl: this.getPublicUrl(s3Key),
      expiresIn: 300,
    };
  }

  async deleteObject(s3Key: string): Promise<void> {
    if (!s3Key || !this.isManagedKey(s3Key)) {
      return;
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete S3 object "${s3Key}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteObjects(s3Keys: Array<string | null | undefined>): Promise<number> {
    const validKeys = Array.from(
      new Set(
        s3Keys.filter(
          (k): k is string => Boolean(k) && this.isManagedKey(k as string),
        ),
      ),
    );

    if (validKeys.length === 0) {
      return 0;
    }

    let deletedCount = 0;

    // S3 DeleteObjects supports up to 1000 keys per call
    for (let i = 0; i < validKeys.length; i += 1000) {
      const batch = validKeys.slice(i, i + 1000);
      try {
        const res = await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: batch.map((Key) => ({ Key })),
              Quiet: false,
            },
          }),
        );
        deletedCount += res.Deleted?.length ?? batch.length;
        if (res.Errors && res.Errors.length > 0) {
          this.logger.error(
            `Partial S3 delete errors: ${JSON.stringify(res.Errors)}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to batch delete S3 objects (${batch.join(', ')}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return deletedCount;
  }
}
