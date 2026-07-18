import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.notesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.findOne(req.user.userId, id);
  }

  @Post()
  create(@Request() req: any, @Body() createNoteDto: Omit<Prisma.NoteCreateInput, 'user'>) {
    return this.notesService.create(req.user.userId, createNoteDto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: Partial<Prisma.NoteUpdateInput>,
  ) {
    return this.notesService.update(req.user.userId, id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.remove(req.user.userId, id);
  }
}
