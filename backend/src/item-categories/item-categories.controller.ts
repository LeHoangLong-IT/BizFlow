import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('item-categories')
export class ItemCategoriesController {
  constructor(private readonly categoriesService: ItemCategoriesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() data: { name: string; color?: string }) {
    return this.categoriesService.create(req.user.userId, data);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: { name?: string; color?: string }) {
    return this.categoriesService.update(req.user.userId, +id, data);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.userId, +id);
  }
}
