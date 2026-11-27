import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CarsModule } from './cars/cars.module';
import { ContactModule } from './contact/contact.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { RampsModule } from './ramps/ramps.module';
import { UploadsModule } from './uploads/uploads.module';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'rockyca-api' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'long', ttl: 3_600_000, limit: 300 },
    ]),
    PrismaModule,
    AuthModule,
    UploadsModule,
    CarsModule,
    RampsModule,
    InventoryModule,
    ContactModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
