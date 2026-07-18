import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.tagsService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() data: { name: string; color: string }) {
    return this.tagsService.create(req.user.userId, data);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: { name?: string; color?: string }) {
    return this.tagsService.update(req.user.userId, +id, data);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tagsService.remove(req.user.userId, +id);
  }
}
