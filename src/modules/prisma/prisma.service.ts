import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('App - Prisma Service');

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database Connected.');
    } catch (error) {
      this.logger.error(
        `数据库连接失败: ${error instanceof Error ? error.stack : '未知错误'}`,
      );
      throw error;
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
