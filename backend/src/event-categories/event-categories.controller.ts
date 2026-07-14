import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { EventCategoriesService } from './event-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('event-categories')
export class EventCategoriesController {
  constructor(private readonly eventCategoriesService: EventCategoriesService) {}

  @Post()
  create(@Req() req: any, @Body() createDto: { name: string; color: string }) {
    return this.eventCategoriesService.create(req.user.userId, createDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.eventCategoriesService.findAll(req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: { name?: string; color?: string }
  ) {
    return this.eventCategoriesService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eventCategoriesService.remove(req.user.userId, id);
  }
}
