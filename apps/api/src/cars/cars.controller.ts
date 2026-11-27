import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AdminListCarsQueryDto,
  AttachVehicleImageDto,
  CreateCarDto,
  ListCarsQueryDto,
  UpdateCarDto,
} from './cars.dto';
import { CarsService } from './cars.service';

@Controller()
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // Public routes (only in_stock vehicles)
  @Get('cars')
  listPublic(@Query() query: ListCarsQueryDto) {
    return this.carsService.listPublic(query);
  }

  @Get('cars/:id')
  findPublicById(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findPublicById(id);
  }

  // Admin routes (full CRUD + image management)
  @Get('admin/cars')
  @UseGuards(JwtAuthGuard)
  listAdmin(@Query() query: AdminListCarsQueryDto) {
    return this.carsService.listAdmin(query);
  }

  @Get('admin/cars/:id')
  @UseGuards(JwtAuthGuard)
  findAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.findAdminById(id);
  }

  @Post('admin/cars')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCarDto) {
    return this.carsService.create(dto);
  }

  @Patch('admin/cars/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCarDto) {
    return this.carsService.update(id, dto);
  }

  @Delete('admin/cars/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.carsService.remove(id);
  }

  @Post('admin/cars/:id/images')
  @UseGuards(JwtAuthGuard)
  addImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachVehicleImageDto,
  ) {
    return this.carsService.addImage(id, dto);
  }

  @Patch('admin/cars/:id/images/:imageId/primary')
  @UseGuards(JwtAuthGuard)
  setPrimaryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.carsService.setPrimaryImage(id, imageId);
  }

  @Delete('admin/cars/:id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.carsService.removeImage(id, imageId);
  }
}
