import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupportService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Email sending will fail.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendSupportRequest(userId: string, message: string): Promise<void> {
    const user = await this.db.queryOne<{
      fullName: string;
      email: string;
      phone: string;
      jobTitle: string | null;
      companyId: string | null;
    }>(
      `SELECT "fullName", email, phone, "jobTitle", "companyId" FROM "User" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const company = user.companyId
      ? await this.db.queryOne<{ name: string }>(
          `SELECT name FROM "Company" WHERE id = $1`,
          [user.companyId],
        )
      : null;

    const ticketId = this.db.newId();
    await this.db.query(
      `INSERT INTO "SupportTicket" (id, "userId", subject, message, status, priority)
       VALUES ($1, $2, $3, $4, 'OPEN', 'MEDIUM')`,
      [ticketId, userId, message.substring(0, 100), message],
    );

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

    if (!adminEmail) {
      console.warn('Admin email not configured. Ticket created but email not sent.');
      return;
    }

    const emailContent = `
      <motion.div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Нове звернення від користувача</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ім'я та прізвище:</strong> ${user.fullName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Телефон:</strong> ${user.phone}</p>
          <p><strong>Компанія:</strong> ${company?.name || 'Не вказана'}</p>
          <p><strong>Посада:</strong> ${user.jobTitle || 'Не вказана'}</p>
        </motion.div>
        <motion.div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #555; margin-top: 0;">Повідомлення:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </motion.div>
      </motion.div>
    `.replace(/<\/?motion\./g, (m) => m.replace('motion.', ''));

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: adminEmail,
        subject: `Звернення від ${user.fullName} (${company?.name || 'Без компанії'})`,
        html: emailContent,
      });
    } catch (error) {
      console.error('Failed to send support email:', error);
    }
  }
}
