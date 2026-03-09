import argon2 from 'argon2';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  CACHE_KEY_PREFIX,
  MAX_SESSIONS_PER_USER,
  TOKEN_EXPIRY,
} from './auth.config';

/** 认证后的用户信息（不含密码） */
export interface AuthUser {
  userId: string;
  username: string;
}

/** 登录时写入 Session 表的可选元数据（IP、UA、设备名等） */
export interface SessionMeta {
  ip?: string;
  userAgent?: string;
  deviceName?: string;
}

/** 登录成功返回的 token 结构 */
export interface TokenPair {
  access_token: string;
}

/** JWT payload 结构 */
export interface JwtPayload {
  sub: string;
  username: string;
  jti: string;
}

/** 单设备登出结果 */
export interface LogoutResult {
  message: string;
  revokedJti: string;
}

/** 全部设备登出结果 */
export interface LogoutAllResult {
  message: string;
  revokedCount: number;
  revokedJtis: string[];
}

const MS_PER_SECOND = 1000;
const TTL_MS = TOKEN_EXPIRY * MS_PER_SECOND;

/** 认证服务：登录、登出、token 校验及多设备会话管理 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 校验用户名与密码
   * @param username - 用户名
   * @param pass - 明文密码
   * @returns 校验通过返回用户信息（不含密码），否则返回 null
   */
  async validateUser(username: string, pass: string): Promise<AuthUser | null> {
    const user = await this.usersService.findOne(username);
    if (!user) return null;
    const isMatch = await argon2.verify(user.password, pass);
    if (!isMatch) return null;
    return { userId: user.id, username: user.username };
  }

  /**
   * 登录：生成 access_token 并存入缓存与 Session 表，支持多设备
   * @param user - 已校验用户信息
   * @param meta - 可选会话元数据（ip、userAgent、deviceName），用于 Session 表
   * @returns 包含 access_token 的对象
   * @remarks 超出最大会话数时踢掉最旧会话（缓存 + Session 表同步删除）
   */
  async login(user: AuthUser, meta?: SessionMeta): Promise<TokenPair> {
    const jti = randomUUID();
    const sessions = await this.getSessions(user.userId);

    if (sessions.length >= MAX_SESSIONS_PER_USER) {
      const oldestJti = sessions.pop()!;
      await Promise.all([
        this.cacheManager.del(
          `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${user.userId}:${oldestJti}`,
        ),
        this.prisma.session.deleteMany({ where: { jti: oldestJti } }),
      ]);
    }
    sessions.unshift(jti);

    const access_token = await this.jwtService.signAsync(
      { sub: user.userId, username: user.username, jti },
      { expiresIn: TOKEN_EXPIRY },
    );

    await Promise.all([
      this.cacheManager.set(
        `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${user.userId}:${jti}`,
        access_token,
        TTL_MS,
      ),
      this.saveSessions(user.userId, sessions),
      this.prisma.session.create({
        data: {
          userId: user.userId,
          jti,
          ip: meta?.ip ?? undefined,
          userAgent: meta?.userAgent ?? undefined,
          deviceName: meta?.deviceName ?? undefined,
        },
      }),
    ]);
    return { access_token };
  }

  /**
   * 登出当前设备
   * @param userId - 用户 ID
   * @param jti - 当前会话的 JWT ID
   * @returns 登出结果，含被撤销的 jti 及剩余会话数
   */
  async logout(userId: string, jti: string): Promise<LogoutResult> {
    await Promise.all([
      this.cacheManager.del(`${CACHE_KEY_PREFIX.ACCESS_TOKEN}${userId}:${jti}`),
      this.prisma.session.deleteMany({ where: { jti } }),
    ]);
    const sessions = await this.getSessions(userId);
    const filtered = sessions.filter((id) => id !== jti);
    if (filtered.length > 0) {
      await this.saveSessions(userId, filtered);
    } else {
      await this.cacheManager.del(`${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`);
    }
    return {
      message: '登出成功',
      revokedJti: jti,
    };
  }

  /**
   * 登出全部设备
   * @param userId - 用户 ID
   * @returns 登出结果，含撤销的会话数量及 jti 列表
   */
  async logoutAll(userId: string): Promise<LogoutAllResult> {
    const sessions = await this.getSessions(userId);
    await Promise.all([
      ...sessions.map((jti) =>
        this.cacheManager.del(
          `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${userId}:${jti}`,
        ),
      ),
      this.cacheManager.del(`${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`),
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);
    return {
      message: '已登出全部设备',
      revokedCount: sessions.length,
      revokedJtis: sessions,
    };
  }

  /**
   * 校验 token 是否在缓存中且与请求一致
   * @param userId - 用户 ID
   * @param jti - JWT ID
   * @param token - 请求携带的完整 token 字符串
   * @returns 缓存存在且与 token 一致返回 true，否则 false
   */
  async validateAccessToken(
    userId: string,
    jti: string,
    token: string,
  ): Promise<boolean> {
    const cached = await this.cacheManager.get<string>(
      `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${userId}:${jti}`,
    );
    return cached === token;
  }

  /**
   * 获取用户当前会话 jti 列表（按时间倒序，最新在前）
   * @param userId - 用户 ID
   * @returns jti 数组
   */
  private async getSessions(userId: string): Promise<string[]> {
    const raw = await this.cacheManager.get<string>(
      `${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`,
    );
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as unknown;
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [];
    }
  }

  /**
   * 保存用户会话 jti 列表到缓存
   * @param userId - 用户 ID
   * @param sessions - jti 数组（最新在前）
   */
  private async saveSessions(
    userId: string,
    sessions: string[],
  ): Promise<void> {
    await this.cacheManager.set(
      `${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`,
      JSON.stringify(sessions),
      TTL_MS,
    );
  }
}
