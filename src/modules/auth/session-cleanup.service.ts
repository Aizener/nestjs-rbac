import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { REMEMBER_ME_EXPIRY } from './auth.config';

const MS_PER_SECOND = 1000;

/**
 * Session 定时清理：删除 loginAt 超过 token 有效期的 Session 记录。
 * 缓存中的 token 由 TTL 自动过期，Session 表需定时清理以保持一致性。
 * 使用最长有效期（记住我 = 7 天），避免过早删除仍有效的会话。
 */
@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 定时清理过期 Session。
   * Cron 格式（5 位）：分 时 日 月 周
   * - 每分钟：* * * * *
   * - 每 12 小时：0 0,12 * * *（0:00、12:00）
   * - 每 24 小时：0 0 * * *（每天 0:00）
   */
  @Cron('* * * * *')
  async handleExpiredSessions(): Promise<void> {
    const tokenExpiryMs = REMEMBER_ME_EXPIRY * MS_PER_SECOND;
    const cutoff = new Date(Date.now() - tokenExpiryMs);

    const result = await this.prisma.session.deleteMany({
      where: { loginAt: { lt: cutoff } },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned ${result.count} expired session(s)`);
    }
  }
}
