import type { Session } from 'generated/prisma/client';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

const SESSION_SELECT = {
  id: true,
  jti: true,
  ip: true,
  userAgent: true,
  deviceName: true,
  loginAt: true,
  lastActiveAt: true,
} as const;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /** 获取当前用户的设备列表（按登录时间倒序） */
  async findMySessions(
    userId: string,
  ): Promise<Pick<Session, keyof typeof SESSION_SELECT>[]> {
    return this.prisma.session.findMany({
      where: { userId },
      select: SESSION_SELECT,
      orderBy: { loginAt: 'desc' },
    });
  }

  /** 踢掉指定设备，需校验归属 */
  async revokeByJti(userId: string, jti: string): Promise<{ message: string }> {
    const session = await this.prisma.session.findUnique({
      where: { jti },
      select: { userId: true },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.userId !== userId)
      throw new ForbiddenException('无权限操作该会话');
    await this.authService.logout(userId, jti);
    return { message: '已踢掉该设备' };
  }

  /** 更新设备名称 */
  async updateDeviceName(
    userId: string,
    jti: string,
    deviceName?: string,
  ): Promise<Pick<Session, keyof typeof SESSION_SELECT>> {
    const session = await this.prisma.session.findUnique({
      where: { jti },
      select: { userId: true },
    });
    if (!session) throw new NotFoundException('会话不存在');
    if (session.userId !== userId)
      throw new ForbiddenException('无权限操作该会话');
    return this.prisma.session.update({
      where: { jti },
      data: { deviceName: deviceName ?? null },
      select: SESSION_SELECT,
    });
  }
}
