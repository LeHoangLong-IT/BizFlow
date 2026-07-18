import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RRule } from 'rrule';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: [
        { isCompleted: 'asc' },
        { dueDate: 'asc' }
      ],
      include: { note: true, subtasks: true, tags: true, category: true }
    });
  }

  async findOne(userId: number, id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: { note: true, subtasks: true, tags: true, category: true }
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: number, data: any) {
    const createData: any = { ...data, userId };
    if (data.tagIds) {
      createData.tags = {
        connect: data.tagIds.map((id: number) => ({ id }))
      };
      delete createData.tagIds;
    }
    const task = await this.prisma.task.create({
      data: createData,
    });
    await this.addActivity(task.id, 'Đã tạo danh sách công việc');
    return task;
  }

  async update(userId: number, id: number, data: any) {
    const task = await this.prisma.task.findFirst({ where: { id, userId }, include: { tags: true } });
    if (!task) throw new NotFoundException('Task not found');

    // Handle recurring task completion (Approach B: Clone and forward)
    if (data.isCompleted === true && task.isCompleted === false && task.recurrenceRule && task.startDate) {
      const ruleString = task.recurrenceRule.replace(/^RRULE:/, ''); // ensure clean string
      try {
        const rule = RRule.fromString(`RRULE:${ruleString}`);
        // Calculate the next occurrence strictly after the current start date
        const nextOccurrence = rule.after(new Date(task.startDate));
        
        if (nextOccurrence) {
          // Calculate the duration if there is a due date
          let nextDueDate = null;
          if (task.dueDate) {
            const duration = new Date(task.dueDate).getTime() - new Date(task.startDate).getTime();
            nextDueDate = new Date(nextOccurrence.getTime() + duration);
          }

          // Create the next active recurring task
          const nextTask = await this.prisma.task.create({
            data: {
              userId,
              noteId: task.noteId,
              content: task.content,
              description: task.description,
              isCompleted: false,
              priority: task.priority,
              startDate: nextOccurrence,
              dueDate: nextDueDate,
              isAllDay: task.isAllDay,
              categoryId: task.categoryId,
              recurrenceRule: task.recurrenceRule,
              tags: {
                connect: task.tags.map(t => ({ id: t.id }))
              }
            }
          });

          await this.prisma.event.create({
            data: {
              userId,
              title: task.content,
              startTime: nextOccurrence,
              endTime: nextDueDate || nextOccurrence,
              isAllDay: task.isAllDay,
              categoryId: task.categoryId,
              sourceType: 'TASK',
              sourceId: nextTask.id,
              recurrenceRule: task.recurrenceRule,
              tags: {
                connect: task.tags.map(t => ({ id: t.id }))
              }
            }
          });

          // Modify the current task to be completed and NO LONGER recurring
          data.recurrenceRule = null;
        }
      } catch (e) {
        console.error("Error parsing RRULE:", e);
      }
    }

    let eventId = task.eventId;

    // Check if recurrenceRule is being modified
    const recurrenceRule = data.recurrenceRule !== undefined ? data.recurrenceRule : task.recurrenceRule;

    // Check if dates or title are being modified
    if (data.startDate !== undefined || data.dueDate !== undefined || data.content !== undefined || data.isAllDay !== undefined || data.categoryId !== undefined || data.recurrenceRule !== undefined) {
      const startDate = data.startDate !== undefined ? data.startDate : task.startDate;
      const dueDate = data.dueDate !== undefined ? data.dueDate : task.dueDate;
      const title = data.content !== undefined ? data.content : task.content;
      const isAllDay = data.isAllDay !== undefined ? data.isAllDay : task.isAllDay;
      const categoryId = data.categoryId !== undefined ? data.categoryId : task.categoryId;

      if (startDate && dueDate) {
        if (eventId) {
          // Update event
          const eventUpdateData: any = {
            title: title as string,
            startTime: new Date(startDate as string | Date),
            endTime: new Date(dueDate as string | Date),
            isAllDay: isAllDay as boolean,
            categoryId: categoryId as number | null,
            recurrenceRule: recurrenceRule as string | null,
          };
          if (data.tagIds !== undefined) {
            eventUpdateData.tags = {
              set: data.tagIds.map((tid: number) => ({ id: tid }))
            };
          }
          await this.prisma.event.update({
            where: { id: eventId },
            data: eventUpdateData
          });
        } else {
          // Create event
          const eventCreateData: any = {
            userId,
            title: title as string,
            startTime: new Date(startDate as string | Date),
            endTime: new Date(dueDate as string | Date),
            isAllDay: isAllDay as boolean,
            categoryId: categoryId as number | null,
            sourceType: 'TASK',
            sourceId: id,
            recurrenceRule: recurrenceRule as string | null,
          };
          if (data.tagIds !== undefined) {
            eventCreateData.tags = {
              connect: data.tagIds.map((tid: number) => ({ id: tid }))
            };
          }
          const event = await this.prisma.event.create({
            data: eventCreateData
          });
          eventId = event.id;
          data.eventId = eventId;
        }
      } else if (!startDate && !dueDate && eventId) {
        // Delete event if dates are removed
        await this.prisma.event.delete({ where: { id: eventId } }).catch(() => {});
        eventId = null;
        data.eventId = null;
      }
    }

    const updateData: any = { ...data };
    if (updateData.tagIds !== undefined) {
      updateData.tags = {
        set: updateData.tagIds.map((tid: number) => ({ id: tid }))
      };
      delete updateData.tagIds;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    if (data.isCompleted !== undefined && data.isCompleted !== task.isCompleted) {
      await this.addActivity(id, data.isCompleted ? 'Đã đánh dấu hoàn thành danh sách' : 'Đã bỏ đánh dấu hoàn thành danh sách');
    }
    if (data.dueDate !== undefined && data.dueDate !== task.dueDate) {
      if (!data.dueDate) {
        await this.addActivity(id, 'Đã gỡ bỏ ngày hết hạn');
      } else {
        await this.addActivity(id, `Đã thay đổi ngày hết hạn thành ${new Date(data.dueDate).toLocaleDateString('vi-VN')}`);
      }
    }
    if (data.content !== undefined && data.content !== task.content) {
      await this.addActivity(id, `Đã đổi tên công việc từ "${task.content}" thành "${data.content}"`);
    }

    return updatedTask;
  }

  async remove(userId: number, id: number) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.eventId) {
      await this.prisma.event.delete({ where: { id: task.eventId } }).catch(() => {});
    }

    return this.prisma.task.delete({ where: { id } });
  }

  // --- SUBTASKS ---
  async addSubTask(userId: number, taskId: number, data: Omit<Prisma.SubTaskUncheckedCreateInput, 'taskId'>) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');
    const sub = await this.prisma.subTask.create({ data: { ...data, taskId } });
    await this.addActivity(taskId, `Đã thêm mục con: ${data.content}`);
    return sub;
  }

  async updateSubTask(userId: number, subTaskId: number, data: Prisma.SubTaskUncheckedUpdateInput) {
    const subTask = await this.prisma.subTask.findFirst({ where: { id: subTaskId }, include: { task: true } });
    if (!subTask || subTask.task.userId !== userId) throw new NotFoundException('SubTask not found');
    
    if (data.isCompleted !== undefined && data.isCompleted !== subTask.isCompleted) {
      await this.addActivity(subTask.taskId, data.isCompleted ? `Đã hoàn thành mục: ${subTask.content}` : `Đã bỏ hoàn thành mục: ${subTask.content}`);
    }
    
    if (data.content !== undefined && data.content !== subTask.content) {
      await this.addActivity(subTask.taskId, `Đã đổi tên mục con từ "${subTask.content}" thành "${data.content}"`);
    }
    
    return this.prisma.subTask.update({ where: { id: subTaskId }, data });
  }

  async removeSubTask(userId: number, subTaskId: number) {
    const subTask = await this.prisma.subTask.findFirst({ where: { id: subTaskId }, include: { task: true } });
    if (!subTask || subTask.task.userId !== userId) throw new NotFoundException('SubTask not found');
    
    await this.addActivity(subTask.taskId, `Đã xóa mục con: ${subTask.content}`);
    return this.prisma.subTask.delete({ where: { id: subTaskId } });
  }

  // --- ACTIVITIES ---
  async addActivity(taskId: number, content: string, type: string = 'SYSTEM') {
    return this.prisma.taskActivity.create({
      data: { taskId, content, type }
    });
  }

  async getActivities(userId: number, taskId: number) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.taskActivity.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async removeActivity(userId: number, activityId: number) {
    const activity = await this.prisma.taskActivity.findFirst({
      where: { id: activityId },
      include: { task: true }
    });
    if (!activity || activity.task.userId !== userId) {
      throw new NotFoundException('Activity not found');
    }
    return this.prisma.taskActivity.delete({ where: { id: activityId } });
  }
}
