import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UserRole } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  private async generateUniqueInviteCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existing = await this.db.queryOne(
        `SELECT id FROM "Company" WHERE "inviteCode" = $1`,
        [code],
      );
      if (!existing) {
        isUnique = true;
      }
    }
    return code!;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.db.queryOne(
      `SELECT id FROM "User" WHERE email = $1 OR phone = $2`,
      [dto.email, dto.phone],
    );

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const inviteCode = await this.generateUniqueInviteCode();
    const companyId = this.db.newId();
    const userId = this.db.newId();

    await this.db.transaction(async (client) => {
      await client.query(
        `INSERT INTO "Company" (id, name, "inviteCode") VALUES ($1, $2, $3)`,
        [companyId, dto.companyName, inviteCode],
      );
      await client.query(
        `INSERT INTO "User" (id, email, phone, password, "fullName", role, "jobTitle", "companyId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          dto.email,
          dto.phone,
          hashedPassword,
          dto.fullName,
          UserRole.OWNER,
          'Власник',
          companyId,
        ],
      );
    });

    return this.generateToken(
      userId,
      dto.email,
      'USER',
      UserRole.OWNER,
      companyId,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.db.queryOne<{
      id: string;
      email: string;
      password: string;
      globalRole: string;
      role: string;
      companyId: string | null;
    }>(
      `SELECT id, email, password, "globalRole", role, "companyId"
       FROM "User" WHERE email = $1 OR phone = $1`,
      [dto.login],
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(
      user.id,
      user.email,
      user.globalRole,
      user.role,
      user.companyId,
    );
  }

  async registerEmployee(dto: RegisterEmployeeDto) {
    const existingUser = await this.db.queryOne(
      `SELECT id FROM "User" WHERE email = $1 OR phone = $2`,
      [dto.email, dto.phone],
    );
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const company = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM "Company" WHERE "inviteCode" = $1`,
      [dto.inviteCode],
    );
    if (!company) {
      throw new ConflictException('Invalid company code');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userId = this.db.newId();

    await this.db.query(
      `INSERT INTO "User" (id, email, phone, password, "fullName", role, "jobTitle", "companyId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        dto.email,
        dto.phone,
        hashedPassword,
        dto.fullName,
        UserRole.EMPLOYEE,
        'Працівник',
        company.id,
      ],
    );

    return this.generateToken(
      userId,
      dto.email,
      'USER',
      UserRole.EMPLOYEE,
      company.id,
    );
  }

  private generateToken(
    userId: string,
    email: string,
    globalRole: string,
    role: string,
    companyId: string | null,
  ) {
    const payload = { sub: userId, email, globalRole, role, companyId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: userId,
        email,
        globalRole,
        role,
        companyId,
      },
    };
  }
}
