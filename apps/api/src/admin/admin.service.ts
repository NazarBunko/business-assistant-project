import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  SupportTicketStatus,
  SupportTicketPriority,
} from '@repo/database';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async getDashboardStats() {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const row = await this.db.queryOne<{
      totalCompanies: string;
      totalUsers: string;
      totalActiveUsers: string;
      totalTransactions: string;
      openTickets: string;
      companiesThisMonth: string;
      usersThisMonth: string;
    }>(
      `SELECT
        (SELECT COUNT(*)::text FROM "Company") AS "totalCompanies",
        (SELECT COUNT(*)::text FROM "User") AS "totalUsers",
        (SELECT COUNT(*)::text FROM "User" WHERE "isBlocked" = false) AS "totalActiveUsers",
        (SELECT COUNT(*)::text FROM "Transaction") AS "totalTransactions",
        (SELECT COUNT(*)::text FROM "SupportTicket" WHERE status IN ('OPEN', 'IN_PROGRESS')) AS "openTickets",
        (SELECT COUNT(*)::text FROM "Company" WHERE "createdAt" >= $1) AS "companiesThisMonth",
        (SELECT COUNT(*)::text FROM "User" WHERE "createdAt" >= $1) AS "usersThisMonth"`,
      [monthStart],
    );

    const totalUsers = parseInt(row?.totalUsers ?? '0', 10);
    const totalActiveUsers = parseInt(row?.totalActiveUsers ?? '0', 10);

    return {
      totalCompanies: parseInt(row?.totalCompanies ?? '0', 10),
      totalUsers,
      totalActiveUsers,
      totalBlockedUsers: totalUsers - totalActiveUsers,
      totalTransactions: parseInt(row?.totalTransactions ?? '0', 10),
      openTickets: parseInt(row?.openTickets ?? '0', 10),
      companiesThisMonth: parseInt(row?.companiesThisMonth ?? '0', 10),
      usersThisMonth: parseInt(row?.usersThisMonth ?? '0', 10),
    };
  }

  async getAllUsers(page: number = 1, search?: string) {
    const take = 20;
    const skip = (page - 1) * take;

    const params: unknown[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      where = `WHERE u."fullName" ILIKE $1 OR u.email ILIKE $2 OR u.phone ILIKE $3`;
    }

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "User" u ${where}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const limitOffset = search
      ? ` LIMIT $4 OFFSET $5`
      : ` LIMIT $1 OFFSET $2`;
    const listParams = search
      ? [...params, take, skip]
      : [take, skip];

    const users = await this.db.query(
      `SELECT u.*,
              c.id AS "company_id", c.name AS "company_name",
              (SELECT COUNT(*)::int FROM "SupportTicket" t WHERE t."userId" = u.id) AS "ticketsCount"
       FROM "User" u
       LEFT JOIN "Company" c ON c.id = u."companyId"
       ${where}
       ORDER BY u."createdAt" DESC${limitOffset}`,
      listParams,
    );

    return {
      data: users.map((user: Record<string, unknown>) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        jobTitle: user.jobTitle,
        isBlocked: user.isBlocked,
        company: user.company_id
          ? { id: user.company_id, name: user.company_name }
          : null,
        ticketsCount: user.ticketsCount,
        createdAt: user.createdAt,
      })),
      total,
      totalPages: Math.ceil(total / take),
      currentPage: page,
    };
  }

  async blockUser(userId: string) {
    const user = await this.db.queryOne<{ globalRole: string }>(
      `SELECT "globalRole" FROM "User" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.globalRole === 'ADMIN') {
      throw new BadRequestException('Cannot block admin users');
    }

    const rows = await this.db.query(
      `UPDATE "User" SET "isBlocked" = true WHERE id = $1 RETURNING *`,
      [userId],
    );
    return rows[0];
  }

  async unblockUser(userId: string) {
    const rows = await this.db.query(
      `UPDATE "User" SET "isBlocked" = false WHERE id = $1 RETURNING *`,
      [userId],
    );
    return rows[0];
  }

  async deleteUser(userId: string) {
    const user = await this.db.queryOne<{ globalRole: string }>(
      `SELECT "globalRole" FROM "User" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.globalRole === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin users');
    }

    const rows = await this.db.query(`DELETE FROM "User" WHERE id = $1 RETURNING *`, [
      userId,
    ]);
    return rows[0];
  }

  async getAllCompanies(page: number = 1, search?: string) {
    const take = 20;
    const skip = (page - 1) * take;

    const params: unknown[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE c.name ILIKE $1`;
    }

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "Company" c ${where}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const listParams = search ? [...params, take, skip] : [take, skip];
    const limitOffset = search ? ` LIMIT $2 OFFSET $3` : ` LIMIT $1 OFFSET $2`;

    const companies = await this.db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int FROM "User" u WHERE u."companyId" = c.id) AS "usersCount",
              (SELECT COUNT(*)::int FROM "Transaction" t WHERE t."companyId" = c.id) AS "transactionsCount"
       FROM "Company" c
       ${where}
       ORDER BY c."createdAt" DESC${limitOffset}`,
      listParams,
    );

    return {
      data: companies.map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        balance: c.balance,
        taxGroup: c.taxGroup,
        usersCount: c.usersCount,
        transactionsCount: c.transactionsCount,
        createdAt: c.createdAt,
      })),
      total,
      totalPages: Math.ceil(total / take),
      currentPage: page,
    };
  }

  async getCompanyDetails(companyId: string) {
    const company = await this.db.queryOne(
      `SELECT * FROM "Company" WHERE id = $1`,
      [companyId],
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const users = await this.db.query(
      `SELECT id, "fullName", email, role, "isBlocked" FROM "User" WHERE "companyId" = $1`,
      [companyId],
    );

    const counts = await this.db.queryOne<{
      transactions: string;
      salaryPayments: string;
    }>(
      `SELECT
        (SELECT COUNT(*)::text FROM "Transaction" WHERE "companyId" = $1) AS transactions,
        (SELECT COUNT(*)::text FROM "SalaryPayment" WHERE "companyId" = $1) AS "salaryPayments"`,
      [companyId],
    );

    return {
      ...company,
      users,
      _count: {
        transactions: parseInt(counts?.transactions ?? '0', 10),
        salaryPayments: parseInt(counts?.salaryPayments ?? '0', 10),
      },
    };
  }

  async getAllTickets(page: number = 1, status?: string) {
    const take = 20;
    const skip = (page - 1) * take;

    const params: unknown[] = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE t.status = $1`;
    }

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "SupportTicket" t ${where}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const listParams = status ? [...params, take, skip] : [take, skip];
    const limitOffset = status ? ` LIMIT $2 OFFSET $3` : ` LIMIT $1 OFFSET $2`;

    const tickets = await this.db.query(
      `SELECT t.*,
              u.id AS "user_id", u."fullName" AS "user_fullName", u.email AS "user_email",
              c.name AS "company_name",
              (SELECT COUNT(*)::int FROM "SupportResponse" r WHERE r."ticketId" = t.id) AS "responsesCount"
       FROM "SupportTicket" t
       JOIN "User" u ON u.id = t."userId"
       LEFT JOIN "Company" c ON c.id = u."companyId"
       ${where}
       ORDER BY
         CASE t.status WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END,
         CASE t.priority WHEN 'URGENT' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END DESC,
         t."createdAt" DESC
       ${limitOffset}`,
      listParams,
    );

    return {
      data: tickets.map((t: Record<string, unknown>) => ({
        ...t,
        user: {
          id: t.user_id,
          fullName: t.user_fullName,
          email: t.user_email,
          company: t.company_name ? { name: t.company_name } : null,
        },
        _count: { responses: t.responsesCount },
      })),
      total,
      totalPages: Math.ceil(total / take),
      currentPage: page,
    };
  }

  async getTicketDetails(ticketId: string) {
    const ticket = await this.db.queryOne(
      `SELECT * FROM "SupportTicket" WHERE id = $1`,
      [ticketId],
    );

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.db.queryOne(
      `SELECT u.id, u."fullName", u.email, u.phone, c.id AS "company_id", c.name AS "company_name"
       FROM "User" u
       LEFT JOIN "Company" c ON c.id = u."companyId"
       WHERE u.id = $1`,
      [ticket.userId],
    );

    const responses = await this.db.query(
      `SELECT * FROM "SupportResponse" WHERE "ticketId" = $1 ORDER BY "createdAt" ASC`,
      [ticketId],
    );

    return {
      ...ticket,
      user: user
        ? {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            company: user.company_id
              ? { id: user.company_id, name: user.company_name }
              : null,
          }
        : null,
      responses,
    };
  }

  async updateTicket(
    ticketId: string,
    data: { status?: string; priority?: string },
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (data.status) {
      fields.push(`status = $${i++}`);
      values.push(data.status as SupportTicketStatus);
    }
    if (data.priority) {
      fields.push(`priority = $${i++}`);
      values.push(data.priority as SupportTicketPriority);
    }

    if (fields.length === 0) {
      return this.getTicketDetails(ticketId);
    }

    values.push(ticketId);
    const rows = await this.db.query(
      `UPDATE "SupportTicket" SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return rows[0];
  }

  async addResponse(ticketId: string, message: string, isAdmin = true) {
    const ticket = await this.db.queryOne<{ status: string }>(
      `SELECT status FROM "SupportTicket" WHERE id = $1`,
      [ticketId],
    );

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const responseId = this.db.newId();
    const rows = await this.db.query(
      `INSERT INTO "SupportResponse" (id, message, "isAdmin", "ticketId")
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [responseId, message, isAdmin, ticketId],
    );

    if (isAdmin && ticket.status === 'OPEN') {
      await this.db.query(
        `UPDATE "SupportTicket" SET status = 'IN_PROGRESS' WHERE id = $1`,
        [ticketId],
      );
    }

    return rows[0];
  }

  async deleteTicket(ticketId: string) {
    const rows = await this.db.query(
      `DELETE FROM "SupportTicket" WHERE id = $1 RETURNING *`,
      [ticketId],
    );
    return rows[0];
  }
}
