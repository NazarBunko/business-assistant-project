import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async generateUniqueInviteCode(): Promise<string> {
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
    return code;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const inviteCode = await this.generateUniqueInviteCode();

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        inviteCode: inviteCode,
        users: {
          create: {
            email: dto.email,
            phone: dto.phone,
            fullName: dto.fullName,
            password: hashedPassword,
            role: UserRole.OWNER,
            jobTitle: 'Власник',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = company.users[0];
    return this.generateToken(user.id, user.email, user.role, company.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.login }, { phone: dto.login }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.email, user.role, user.companyId);
  }

  private generateToken(
    userId: string,
    email: string,
    role: string,
    companyId: string,
  ) {
    const payload = { sub: userId, email, role, companyId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: userId,
        email,
        role,
        companyId,
      },
    };
  }
}
