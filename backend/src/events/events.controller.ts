import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.eventsService.findAll(req.user.userId);
  }

  @Post()
  create(@Request() req: any, @Body() createEventDto: Omit<Prisma.EventCreateInput, 'user'>) {
    return this.eventsService.create(req.user.userId, createEventDto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: Partial<Prisma.EventUpdateInput>,
  ) {
    return this.eventsService.update(req.user.userId, id, updateEventDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(req.user.userId, id);
  }
}
