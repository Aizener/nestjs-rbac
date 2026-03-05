import type { Cache } from 'cache-manager';
import { randomUUID } from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import {
  CACHE_KEY_PREFIX,
  MAX_SESSIONS_PER_USER,
  TOKEN_EXPIRY,
} from './auth.config';

/** 认证后的用户信息（不含密码） */
export interface AuthUser {
  userId: number;
  username: string;
}

/** 登录成功返回的 token 结构 */
export interface TokenPair {
  access_token: string;
}

/** JWT payload 结构 */
export interface JwtPayload {
  sub: number;
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 校验用户名与密码
   * @param username - 用户名
   * @param pass - 明文密码
   * @returns 校验通过返回用户信息（不含密码），否则返回 null
   */
  validateUser(username: string, pass: string): AuthUser | null {
    const user = this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 登录：生成 access_token 并存入缓存，支持多设备
   * @param user - 已校验用户信息
   * @returns 包含 access_token 的对象
   * @remarks 超出最大会话数时踢掉最旧会话
   */
  async login(user: AuthUser): Promise<TokenPair> {
    const jti = randomUUID();
    const sessions = await this.getSessions(user.userId);

    if (sessions.length >= MAX_SESSIONS_PER_USER) {
      const oldestJti = sessions.pop()!;
      await this.cacheManager.del(
        `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${user.userId}:${oldestJti}`,
      );
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
    ]);
    return { access_token };
  }

  /**
   * 登出当前设备
   * @param userId - 用户 ID
   * @param jti - 当前会话的 JWT ID
   * @returns 登出结果，含被撤销的 jti 及剩余会话数
   */
  async logout(userId: number, jti: string): Promise<LogoutResult> {
    await this.cacheManager.del(
      `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${userId}:${jti}`,
    );
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
  async logoutAll(userId: number): Promise<LogoutAllResult> {
    const sessions = await this.getSessions(userId);
    await Promise.all([
      ...sessions.map((jti) =>
        this.cacheManager.del(
          `${CACHE_KEY_PREFIX.ACCESS_TOKEN}${userId}:${jti}`,
        ),
      ),
      this.cacheManager.del(`${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`),
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
    userId: number,
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
  private async getSessions(userId: number): Promise<string[]> {
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
    userId: number,
    sessions: string[],
  ): Promise<void> {
    await this.cacheManager.set(
      `${CACHE_KEY_PREFIX.USER_SESSIONS}${userId}`,
      JSON.stringify(sessions),
      TTL_MS,
    );
  }
}
