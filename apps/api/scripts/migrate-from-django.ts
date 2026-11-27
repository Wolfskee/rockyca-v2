/**
 * Idempotent migration script: Old Django (db.sqlite3 + media/) -> PostgreSQL + AWS S3
 *
 * Usage:
 *   # Mode A: You already ran `aws s3 sync` for media/vehicles and media/carfax
 *   npm run migrate:django -- --sqlite=/Users/es/rockyca-migration/db.sqlite3 --skip-upload --dry-run
 *   npm run migrate:django -- --sqlite=/Users/es/rockyca-migration/db.sqlite3 --skip-upload
 *   npm run migrate:django -- --sqlite=/Users/es/rockyca-migration/db.sqlite3 --skip-upload --cleanup-sold-out-s3
 *
 *   # Mode B: Upload only in_stock Car/Ramp images & Carfax PDFs directly to S3 from local media/
 *   npm run migrate:django -- --sqlite=/Users/es/rockyca-migration/db.sqlite3 --media=/Users/es/rockyca-migration/media
 */
import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  CarType,
  Drivetrain,
  FuelType,
  InventoryStatus,
  PrismaClient,
  Transmission,
} from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import * as os from 'os';
import * as path from 'path';

// Always load apps/api/.env regardless of which directory the script is invoked from
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface OldCarRow {
  id: number;
  name: string;
  make: string;
  year: number;
  mileage: number;
  stock_number: string;
  vin: string;
  type: string | null;
  transmission: string;
  fuel: string;
  drivetrain: string;
  engine: string;
  cylinders: string;
  color: string;
  interior_color: string;
  doors: number;
  max_passengers: number;
  description: string;
  carfax: string | null;
  price: number | string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OldRampRow {
  id: number;
  stock_number: string;
  length: number | string | null;
  width: number | string | null;
  height: number | string | null;
  weight: number | string | null;
  capacity: number | string | null;
  material: string | null;
  description: string;
  price: number | string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OldVehicleImageRow {
  id: number;
  car_id: number | null;
  atv_id: number | null;
  ramp_id: number | null;
  image: string;
  is_primary: number | boolean;
  created_at: string;
}

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

function expandHome(inputPath: string): string {
  if (!inputPath) return '';
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) {
      args[arg.slice(2)] = true;
    } else {
      args[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return {
    sqlitePath:
      typeof args.sqlite === 'string' ? expandHome(args.sqlite) : '',
    mediaDir: typeof args.media === 'string' ? expandHome(args.media) : '',
    skipUpload: Boolean(args['skip-upload']),
    cleanupSoldOutS3: Boolean(args['cleanup-sold-out-s3']),
    dryRun: Boolean(args['dry-run']),
  };
}

function normalizeS3Key(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^media\//, '');
}

function parseDjangoDate(raw: string | null | undefined): Date {
  if (!raw) return new Date();
  const trimmed = raw.trim();
  // Django SQLite stores UTC timestamps like "2025-08-24 23:04:40.123456"
  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T');
  const withTz = /(Z|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const parsed = new Date(withTz);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function createS3Helper() {
  const region = process.env.AWS_REGION || 'ca-central-1';
  const bucket = process.env.AWS_S3_BUCKET || 'rockyca-inventory-media';
  const publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL || '').replace(
    /\/+$/,
    '',
  );
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });

  const getPublicUrl = (s3Key: string) => {
    const encodedKey = s3Key
      .replace(/^\/+/, '')
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    if (publicBaseUrl) return `${publicBaseUrl}/${encodedKey}`;
    if (endpoint && forcePathStyle) {
      return `${endpoint.replace(/\/+$/, '')}/${bucket}/${encodedKey}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
  };

  return { client, bucket, region, endpoint, getPublicUrl };
}

function toStatus(raw: string | null | undefined): InventoryStatus {
  return raw?.trim().toLowerCase() === 'sold_out'
    ? InventoryStatus.sold_out
    : InventoryStatus.in_stock;
}

function toCarType(raw: string | null | undefined): CarType | null {
  const v = raw?.trim().toLowerCase();
  if (v === 'sedan' || v === 'suv' || v === 'pickup') {
    return v as CarType;
  }
  return null;
}

function toTransmission(raw: string | null | undefined): Transmission {
  return raw?.trim().toLowerCase() === 'manual'
    ? Transmission.manual
    : Transmission.auto;
}

function toFuel(raw: string | null | undefined): FuelType {
  const v = raw?.trim().toLowerCase();
  if (v === 'gas' || v === 'diesel' || v === 'electric' || v === 'hybrid') {
    return v as FuelType;
  }
  return FuelType.gas;
}

function toDrivetrain(raw: string | null | undefined): Drivetrain {
  const v = raw?.trim().toLowerCase();
  if (v === 'awd' || v === 'fwd' || v === 'rwd') {
    return v as Drivetrain;
  }
  return Drivetrain.awd;
}

function toOptionalNum(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function tableExists(db: DatabaseSync, name: string): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    )
    .get(name) as { name: string } | undefined;
  return Boolean(row);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.sqlitePath) {
    console.error(
      'Missing --sqlite=/path/to/db.sqlite3\nExample: npm run migrate:django -- --sqlite=/Users/es/rockyca-migration/db.sqlite3 --skip-upload --dry-run',
    );
    process.exit(1);
  }

  const sqliteFullPath = path.resolve(opts.sqlitePath);
  if (!fs.existsSync(sqliteFullPath)) {
    console.error(`SQLite file not found: ${sqliteFullPath}`);
    process.exit(1);
  }

  const fileSize = fs.statSync(sqliteFullPath).size;
  if (fileSize === 0) {
    console.error(
      `SQLite file is empty (0 bytes): ${sqliteFullPath}. Make sure you copied the real db.sqlite3 from your server.`,
    );
    process.exit(1);
  }

  if (!opts.skipUpload && !opts.mediaDir) {
    console.error(
      'Provide either --skip-upload (if media is already synced to S3) or --media=/path/to/media',
    );
    process.exit(1);
  }

  const db = new DatabaseSync(sqliteFullPath, { readOnly: true });
  const prisma = opts.dryRun ? null : new PrismaClient();
  const s3 = createS3Helper();

  const stats = {
    carsInStock: 0,
    carsSoldOut: 0,
    rampsInStock: 0,
    rampsSoldOut: 0,
    imagesMigrated: 0,
    carfaxMigrated: 0,
    skippedAtvImages: 0,
    skippedSoldOutMedia: 0,
    missingLocalFiles: 0,
    sampleUrls: [] as string[],
    s3KeysToCleanup: [] as string[],
  };

  async function uploadIfNeeded(s3Key: string): Promise<boolean> {
    if (opts.skipUpload) return true;
    const localFile = path.resolve(opts.mediaDir, s3Key);
    if (!fs.existsSync(localFile)) {
      console.warn(`[WARN] Local media file missing: ${localFile}`);
      stats.missingLocalFiles++;
      return false;
    }
    if (opts.dryRun) return true;

    const ext = path.extname(localFile).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const body = fs.readFileSync(localFile);

    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: s3Key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return true;
  }

  try {
    if (
      !tableExists(db, 'inventory_car') ||
      !tableExists(db, 'inventory_loadingramp') ||
      !tableExists(db, 'inventory_vehicleimage')
    ) {
      throw new Error(
        'SQLite database does not contain expected Django tables (inventory_car, inventory_loadingramp, inventory_vehicleimage).',
      );
    }

    const oldCars = db
      .prepare('SELECT * FROM inventory_car ORDER BY id ASC')
      .all() as unknown as OldCarRow[];
    const oldRamps = db
      .prepare('SELECT * FROM inventory_loadingramp ORDER BY id ASC')
      .all() as unknown as OldRampRow[];
    const oldImages = db
      .prepare('SELECT * FROM inventory_vehicleimage ORDER BY id ASC')
      .all() as unknown as OldVehicleImageRow[];

    console.log(
      `Target S3: bucket="${s3.bucket}" region="${s3.region}"${s3.endpoint ? ` endpoint="${s3.endpoint}"` : ''}`,
    );
    console.log(
      `Loaded from SQLite: ${oldCars.length} cars, ${oldRamps.length} ramps, ${oldImages.length} images (dryRun=${opts.dryRun}, skipUpload=${opts.skipUpload})`,
    );

    const carStatusByOldId = new Map<number, InventoryStatus>();
    const carIdMap = new Map<number, number>();
    const rampStatusByOldId = new Map<number, InventoryStatus>();
    const rampIdMap = new Map<number, number>();

    // 1. Migrate Cars
    for (const row of oldCars) {
      const status = toStatus(row.status);
      carStatusByOldId.set(row.id, status);

      if (status === InventoryStatus.in_stock) {
        stats.carsInStock++;
      } else {
        stats.carsSoldOut++;
      }

      let carfaxKey: string | null = null;
      let carfaxUrl: string | null = null;

      if (row.carfax && row.carfax.trim()) {
        const key = normalizeS3Key(row.carfax.trim());
        if (status === InventoryStatus.in_stock) {
          const ok = await uploadIfNeeded(key);
          if (ok) {
            carfaxKey = key;
            carfaxUrl = s3.getPublicUrl(key);
            stats.carfaxMigrated++;
            if (stats.sampleUrls.length < 5) stats.sampleUrls.push(carfaxUrl);
          }
        } else {
          stats.skippedSoldOutMedia++;
          stats.s3KeysToCleanup.push(key);
        }
      }

      if (prisma) {
        const saved = await prisma.car.upsert({
          where: { stockNumber: row.stock_number.trim() },
          update: {
            name: row.name.trim(),
            make: row.make.trim(),
            year: row.year,
            mileage: row.mileage,
            vin: row.vin.trim().toUpperCase(),
            type: toCarType(row.type),
            transmission: toTransmission(row.transmission),
            fuel: toFuel(row.fuel),
            drivetrain: toDrivetrain(row.drivetrain),
            engine: row.engine.trim(),
            cylinders: row.cylinders.trim(),
            color: row.color.trim(),
            interiorColor: row.interior_color.trim(),
            doors: row.doors,
            maxPassengers: row.max_passengers,
            description: row.description,
            carfaxKey,
            carfaxUrl,
            price: Number(row.price),
            status,
          },
          create: {
            id: row.id,
            name: row.name.trim(),
            make: row.make.trim(),
            year: row.year,
            mileage: row.mileage,
            stockNumber: row.stock_number.trim(),
            vin: row.vin.trim().toUpperCase(),
            type: toCarType(row.type),
            transmission: toTransmission(row.transmission),
            fuel: toFuel(row.fuel),
            drivetrain: toDrivetrain(row.drivetrain),
            engine: row.engine.trim(),
            cylinders: row.cylinders.trim(),
            color: row.color.trim(),
            interiorColor: row.interior_color.trim(),
            doors: row.doors,
            maxPassengers: row.max_passengers,
            description: row.description,
            carfaxKey,
            carfaxUrl,
            price: Number(row.price),
            status,
            createdAt: parseDjangoDate(row.created_at),
            updatedAt: parseDjangoDate(row.updated_at),
          },
        });
        carIdMap.set(row.id, saved.id);

        if (status === InventoryStatus.sold_out) {
          await prisma.vehicleImage.deleteMany({ where: { carId: saved.id } });
        }
      } else {
        carIdMap.set(row.id, row.id);
      }
    }

    // 2. Migrate Loading Ramps
    for (const row of oldRamps) {
      const status = toStatus(row.status);
      rampStatusByOldId.set(row.id, status);

      if (status === InventoryStatus.in_stock) {
        stats.rampsInStock++;
      } else {
        stats.rampsSoldOut++;
      }

      if (prisma) {
        const saved = await prisma.loadingRamp.upsert({
          where: { stockNumber: row.stock_number.trim() },
          update: {
            length: toOptionalNum(row.length),
            width: toOptionalNum(row.width),
            height: toOptionalNum(row.height),
            weight: toOptionalNum(row.weight),
            capacity: toOptionalNum(row.capacity),
            material: row.material?.trim() || null,
            description: row.description,
            price: Number(row.price),
            status,
          },
          create: {
            id: row.id,
            stockNumber: row.stock_number.trim(),
            length: toOptionalNum(row.length),
            width: toOptionalNum(row.width),
            height: toOptionalNum(row.height),
            weight: toOptionalNum(row.weight),
            capacity: toOptionalNum(row.capacity),
            material: row.material?.trim() || null,
            description: row.description,
            price: Number(row.price),
            status,
            createdAt: parseDjangoDate(row.created_at),
            updatedAt: parseDjangoDate(row.updated_at),
          },
        });
        rampIdMap.set(row.id, saved.id);

        if (status === InventoryStatus.sold_out) {
          await prisma.vehicleImage.deleteMany({ where: { rampId: saved.id } });
        }
      } else {
        rampIdMap.set(row.id, row.id);
      }
    }

    // 3. Migrate VehicleImages (only in_stock Cars and LoadingRamps; skip ATVs & sold_out)
    for (const img of oldImages) {
      if (!img.image || !img.image.trim()) continue;
      const s3Key = normalizeS3Key(img.image.trim());

      if (img.atv_id !== null) {
        stats.skippedAtvImages++;
        stats.s3KeysToCleanup.push(s3Key);
        continue;
      }

      if (img.car_id !== null) {
        const status = carStatusByOldId.get(img.car_id);
        const newCarId = carIdMap.get(img.car_id);
        if (status !== InventoryStatus.in_stock || !newCarId) {
          stats.skippedSoldOutMedia++;
          stats.s3KeysToCleanup.push(s3Key);
          continue;
        }
        const ok = await uploadIfNeeded(s3Key);
        if (!ok) continue;

        const url = s3.getPublicUrl(s3Key);
        if (stats.sampleUrls.length < 5) stats.sampleUrls.push(url);

        if (prisma) {
          await prisma.vehicleImage.upsert({
            where: { s3Key },
            update: {
              carId: newCarId,
              url,
              isPrimary: Boolean(img.is_primary),
            },
            create: {
              carId: newCarId,
              s3Key,
              url,
              isPrimary: Boolean(img.is_primary),
              createdAt: parseDjangoDate(img.created_at),
            },
          });
        }
        stats.imagesMigrated++;
      } else if (img.ramp_id !== null) {
        const status = rampStatusByOldId.get(img.ramp_id);
        const newRampId = rampIdMap.get(img.ramp_id);
        if (status !== InventoryStatus.in_stock || !newRampId) {
          stats.skippedSoldOutMedia++;
          stats.s3KeysToCleanup.push(s3Key);
          continue;
        }
        const ok = await uploadIfNeeded(s3Key);
        if (!ok) continue;

        const url = s3.getPublicUrl(s3Key);
        if (stats.sampleUrls.length < 5) stats.sampleUrls.push(url);

        if (prisma) {
          await prisma.vehicleImage.upsert({
            where: { s3Key },
            update: {
              rampId: newRampId,
              url,
              isPrimary: Boolean(img.is_primary),
            },
            create: {
              rampId: newRampId,
              s3Key,
              url,
              isPrimary: Boolean(img.is_primary),
              createdAt: parseDjangoDate(img.created_at),
            },
          });
        }
        stats.imagesMigrated++;
      }
    }

    // 4. Ensure every in_stock car/ramp with images has a primary image & reset PG sequences
    if (prisma) {
      const carsMissingPrimary = await prisma.car.findMany({
        where: {
          status: InventoryStatus.in_stock,
          images: { some: {}, none: { isPrimary: true } },
        },
        include: { images: { orderBy: { createdAt: 'asc' }, take: 1 } },
      });
      for (const car of carsMissingPrimary) {
        if (car.images[0]) {
          await prisma.vehicleImage.update({
            where: { id: car.images[0].id },
            data: { isPrimary: true },
          });
        }
      }

      const rampsMissingPrimary = await prisma.loadingRamp.findMany({
        where: {
          status: InventoryStatus.in_stock,
          images: { some: {}, none: { isPrimary: true } },
        },
        include: { images: { orderBy: { createdAt: 'asc' }, take: 1 } },
      });
      for (const ramp of rampsMissingPrimary) {
        if (ramp.images[0]) {
          await prisma.vehicleImage.update({
            where: { id: ramp.images[0].id },
            data: { isPrimary: true },
          });
        }
      }

      // Sync PostgreSQL autoincrement sequences safely (handles both empty and non-empty tables)
      for (const table of ['cars', 'loading_ramps', 'vehicle_images']) {
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}));`,
        );
      }
    }

    // 5. Optional cleanup of sold_out & ATV files that may have been synced to S3 earlier
    if (
      opts.cleanupSoldOutS3 &&
      !opts.dryRun &&
      stats.s3KeysToCleanup.length > 0
    ) {
      const uniqueKeys = Array.from(new Set(stats.s3KeysToCleanup));
      for (let i = 0; i < uniqueKeys.length; i += 1000) {
        const batch = uniqueKeys.slice(i, i + 1000);
        await s3.client.send(
          new DeleteObjectsCommand({
            Bucket: s3.bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })) },
          }),
        );
      }
      console.log(
        `Cleaned up ${uniqueKeys.length} sold_out / ATV media file(s) from S3.`,
      );
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Cars (in_stock):          ${stats.carsInStock}`);
    console.log(`Cars (sold_out archived): ${stats.carsSoldOut}`);
    console.log(`Ramps (in_stock):         ${stats.rampsInStock}`);
    console.log(`Ramps (sold_out archive): ${stats.rampsSoldOut}`);
    console.log(`Images migrated:          ${stats.imagesMigrated}`);
    console.log(`Carfax PDFs migrated:     ${stats.carfaxMigrated}`);
    console.log(`Skipped ATV images:       ${stats.skippedAtvImages}`);
    console.log(`Skipped sold_out media:   ${stats.skippedSoldOutMedia}`);
    console.log(`Missing local files:      ${stats.missingLocalFiles}`);
    if (stats.sampleUrls.length > 0) {
      console.log('\nSample S3 URLs (verify these open in browser):');
      for (const u of stats.sampleUrls) {
        console.log(`  - ${u}`);
      }
    }
  } finally {
    db.close();
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

