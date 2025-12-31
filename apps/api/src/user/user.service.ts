import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const dataToUpdate: any = { ...dto };

    if (dto.password) {
      const salt = await bcrypt.genSalt();
      dataToUpdate.password = await bcrypt.hash(dto.password, salt);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });
  }
}
