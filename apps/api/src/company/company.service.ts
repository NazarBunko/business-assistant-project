import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateSettings(id: string, dto: UpdateCompanySettingsDto) {
    return this.prisma.company.update({
      where: { id },
      data: {
        revenueFrequency: dto.revenueFrequency,
        taxGroup: dto.taxGroup,
        rentAmount: dto.rentAmount,
        utilitiesAmount: dto.utilitiesAmount,
      },
    });
  }

  async regenerateInviteCode(id: string) {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existing = await this.prisma.company.findUnique({
        where: { inviteCode: code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: { inviteCode: code },
    });
  }
}
