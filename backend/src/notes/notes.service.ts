import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
      include: { 
        tasks: {
          include: { subtasks: true }
        }, 
        tags: true, 
        category: true 
      }
    });
  }

  async findOne(userId: number, id: number) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: { 
        tasks: {
          include: { subtasks: true }
        }, 
        tags: true, 
        category: true 
      }
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(userId: number, data: any) {
    const createData: any = { ...data, userId };
    if (data.tagIds) {
      createData.tags = {
        connect: data.tagIds.map((id: number) => ({ id }))
      };
      delete createData.tagIds;
    }
    return this.prisma.note.create({
      data: createData,
    });
  }

  async update(userId: number, id: number, data: any) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');

    let eventId = note.eventId;

    // Check if recurrenceRule is being modified
    const recurrenceRule = data.recurrenceRule !== undefined ? data.recurrenceRule : note.recurrenceRule;

    // Check if dates or title are being modified
    if (data.startDate !== undefined || data.dueDate !== undefined || data.title !== undefined || data.isAllDay !== undefined || data.categoryId !== undefined || data.recurrenceRule !== undefined) {
      const startDate = data.startDate !== undefined ? data.startDate : note.startDate;
      const dueDate = data.dueDate !== undefined ? data.dueDate : note.dueDate;
      const title = data.title !== undefined ? data.title : note.title;
      const isAllDay = data.isAllDay !== undefined ? data.isAllDay : note.isAllDay;
      const categoryId = data.categoryId !== undefined ? data.categoryId : note.categoryId;

      if (startDate && dueDate) {
        if (eventId) {
          // Update event
          await this.prisma.event.update({
            where: { id: eventId },
            data: {
              title: title as string,
              startTime: new Date(startDate as string | Date),
              endTime: new Date(dueDate as string | Date),
              isAllDay: isAllDay as boolean,
              categoryId: categoryId as number | null,
              recurrenceRule: recurrenceRule as string | null,
            }
          });
        } else {
          // Create event
          const event = await this.prisma.event.create({
            data: {
              userId,
              title: title as string,
              startTime: new Date(startDate as string | Date),
              endTime: new Date(dueDate as string | Date),
              isAllDay: isAllDay as boolean,
              categoryId: categoryId as number | null,
              sourceType: 'NOTE',
              sourceId: id,
              recurrenceRule: recurrenceRule as string | null,
            }
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
        set: updateData.tagIds.map((id: number) => ({ id }))
      };
      delete updateData.tagIds;
    }

    return this.prisma.note.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: number, id: number) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');

    if (note.eventId) {
      await this.prisma.event.delete({ where: { id: note.eventId } }).catch(() => {});
    }

    return this.prisma.note.delete({ where: { id } });
  }
}
