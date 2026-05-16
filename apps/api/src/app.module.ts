import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { CompanyModule } from './company/company.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { InvoiceModule } from './invoice/invoice.module';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '../.env')],
    }),
    ChatModule,
    UserModule,
    TransactionModule,
    CompanyModule,
    SupportModule,
    AdminModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
