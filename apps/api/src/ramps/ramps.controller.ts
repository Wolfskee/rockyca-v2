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
import { AttachVehicleImageDto } from '../cars/cars.dto';
import {
  AdminListRampsQueryDto,
  CreateRampDto,
  ListRampsQueryDto,
  UpdateRampDto,
} from './ramps.dto';
import { RampsService } from './ramps.service';

@Controller()
export class RampsController {
  constructor(private readonly rampsService: RampsService) {}

  @Get('ramps')
  listPublic(@Query() query: ListRampsQueryDto) {
    return this.rampsService.listPublic(query);
  }

  @Get('ramps/:id')
  findPublicById(@Param('id', ParseIntPipe) id: number) {
    return this.rampsService.findPublicById(id);
  }

  @Get('admin/ramps')
  @UseGuards(JwtAuthGuard)
  listAdmin(@Query() query: AdminListRampsQueryDto) {
    return this.rampsService.listAdmin(query);
  }

  @Get('admin/ramps/:id')
  @UseGuards(JwtAuthGuard)
  findAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.rampsService.findAdminById(id);
  }

  @Post('admin/ramps')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateRampDto) {
    return this.rampsService.create(dto);
  }

  @Patch('admin/ramps/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRampDto) {
    return this.rampsService.update(id, dto);
  }

  @Delete('admin/ramps/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rampsService.remove(id);
  }

  @Post('admin/ramps/:id/images')
  @UseGuards(JwtAuthGuard)
  addImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachVehicleImageDto,
  ) {
    return this.rampsService.addImage(id, dto);
  }

  @Patch('admin/ramps/:id/images/:imageId/primary')
  @UseGuards(JwtAuthGuard)
  setPrimaryImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.rampsService.setPrimaryImage(id, imageId);
  }

  @Delete('admin/ramps/:id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.rampsService.removeImage(id, imageId);
  }
}
