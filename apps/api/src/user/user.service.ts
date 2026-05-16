import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { QueryResultRow } from 'pg';

type UserRow = QueryResultRow & { password: string; companyId?: string | null };

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  private omitPassword<T extends UserRow>(row: T) {
    const { password: _password, ...safe } = row;
    return safe;
  }

  async findOne(id: string) {
    const user = await this.db.queryOne<UserRow>(
      `SELECT * FROM "User" WHERE id = $1`,
      [id],
    );
    if (!user) return null;

    const company = user.companyId
      ? await this.db.queryOne(`SELECT * FROM "Company" WHERE id = $1`, [
          user.companyId,
        ])
      : null;

    return { ...this.omitPassword(user), company };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (dto.fullName !== undefined) {
      fields.push(`"fullName" = $${i++}`);
      values.push(dto.fullName);
    }
    if (dto.email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(dto.email);
    }
    if (dto.phone !== undefined) {
      fields.push(`phone = $${i++}`);
      values.push(dto.phone);
    }
    if (dto.jobTitle !== undefined) {
      fields.push(`"jobTitle" = $${i++}`);
      values.push(dto.jobTitle);
    }
    if (dto.password) {
      const salt = await bcrypt.genSalt();
      fields.push(`password = $${i++}`);
      values.push(await bcrypt.hash(dto.password, salt));
    }

    if (fields.length === 0) {
      return this.findOne(userId);
    }

    values.push(userId);
    const rows = await this.db.query<UserRow>(
      `UPDATE "User" SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return this.omitPassword(rows[0]);
  }
}
