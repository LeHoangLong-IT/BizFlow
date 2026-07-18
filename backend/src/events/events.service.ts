import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.event.findMany({ 
      where: { userId },
      include: { tags: true, category: true }
    });
  }

  async create(userId: number, data: any) {
    const createData: any = { ...data, userId };
    if (data.tagIds) {
      createData.tags = {
        connect: data.tagIds.map((id: number) => ({ id }))
      };
      delete createData.tagIds;
    }
    return this.prisma.event.create({
      data: createData,
    });
  }

  async update(userId: number, id: number, data: any) {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');

    const updateData: any = { ...data };
    if (updateData.tagIds !== undefined) {
      updateData.tags = {
        set: updateData.tagIds.map((tid: number) => ({ id: tid }))
      };
      delete updateData.tagIds;
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: number, id: number) {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.delete({ where: { id } });
  }
}
