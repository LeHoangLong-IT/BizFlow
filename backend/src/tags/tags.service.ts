import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createDto: { name: string; color: string }) {
    return this.prisma.tag.create({
      data: {
        userId,
        name: createDto.name,
        color: createDto.color,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  async update(userId: number, id: number, updateDto: { name?: string; color?: string }) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    return this.prisma.tag.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(userId: number, id: number) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
    });
    if (!tag) throw new NotFoundException('Tag not found');

    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
