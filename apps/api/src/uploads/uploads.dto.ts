import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class PresignUploadDto {
  @IsIn(['cars', 'ramps', 'carfax'])
  folder!: 'cars' | 'ramps' | 'carfax';

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  fileSize!: number;
}

export class DeleteObjectDto {
  @IsString()
  @MaxLength(500)
  s3Key!: string;
}
