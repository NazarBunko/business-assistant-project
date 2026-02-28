import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { CompanyModule } from './company/company.module';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '../../../packages/database/.env'),
        join(__dirname, '../.env'),
      ],
    }),
    ChatModule,
    UserModule,
    TransactionModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
