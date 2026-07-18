import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(req.user.userId, id);
  }

  @Post()
  create(@Request() req: any, @Body() createTaskDto: Omit<Prisma.TaskCreateInput, 'user' | 'note'> & { noteId?: number }) {
    return this.tasksService.create(req.user.userId, createTaskDto);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: Partial<Prisma.TaskUpdateInput>,
  ) {
    return this.tasksService.update(req.user.userId, id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(req.user.userId, id);
  }

  @Post(':id/subtasks')
  addSubTask(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() createSubTaskDto: Omit<Prisma.SubTaskCreateInput, 'task'>
  ) {
    return this.tasksService.addSubTask(req.user.userId, id, createSubTaskDto);
  }

  @Patch('subtasks/:subtaskId')
  updateSubTask(
    @Request() req: any,
    @Param('subtaskId', ParseIntPipe) subtaskId: number,
    @Body() updateSubTaskDto: Partial<Prisma.SubTaskUpdateInput>,
  ) {
    return this.tasksService.updateSubTask(req.user.userId, subtaskId, updateSubTaskDto);
  }

  @Delete('subtasks/:subtaskId')
  removeSubTask(@Request() req: any, @Param('subtaskId', ParseIntPipe) subtaskId: number) {
    return this.tasksService.removeSubTask(req.user.userId, subtaskId);
  }

  @Get(':id/activities')
  getActivities(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.tasksService.getActivities(req.user.userId, id);
  }

  @Post(':id/activities')
  addActivity(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { content: string, type?: string }
  ) {
    // Basic authorization check
    this.tasksService.findOne(req.user.userId, id); 
    return this.tasksService.addActivity(id, body.content, body.type || 'COMMENT');
  }

  @Delete('activities/:activityId')
  removeActivity(@Request() req: any, @Param('activityId', ParseIntPipe) activityId: number) {
    return this.tasksService.removeActivity(req.user.userId, activityId);
  }
}
