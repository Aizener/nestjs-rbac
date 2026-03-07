import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/** 能力缓存所需接口，与 cache-manager / Keyv 兼容（ttl 单位毫秒） */
interface CaslCacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

/** CASL 使用字符串表示 action 与 subject，与数据库 Permission 表一致 */
export type AppAction = string;
export type AppSubject = string;
export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

/** 可序列化权限规则，用于缓存 */
export type PermissionRule = { action: string; subject: string };

/** 用户权限查询的 select 形状，仅拉取 CASL 所需的 subject/action，减少内存与 IO */
const USER_PERMISSIONS_SELECT = {
  roles: {
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: { select: { subject: true, action: true } },
            },
          },
        },
      },
    },
  },
} as const;

/** 能力缓存 key 前缀，与 userId 拼接 */
const CACHE_KEY_PREFIX = 'casl:rules:';
/** 能力缓存 TTL（毫秒），角色/权限变更后最多此时间生效 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

/**
 * CASL 能力工厂：根据用户 ID 从 DB 加载「用户 → 角色 → 权限」并构建 Ability。
 *
 * 性能说明（createForUser）：
 * - 使用单次 Prisma 查询 + 嵌套 select，一次往返拉取所有需要的权限，无 N+1。
 * - 仅 select subject/action，不拉取无关字段，数据量小。
 * - 每次受 CaslGuard 保护的请求都会调用 createForUser，高 QPS 下会产生较多 DB 查询。
 * - 因此引入内存缓存：按 userId 缓存「权限规则列表」，命中时直接 build Ability，避免重复查库。
 * - 角色/权限变更后，最多 CACHE_TTL_MS 内生效；若需即时生效可缩短 TTL 或在分配接口中主动 del 缓存。
 */
@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: CaslCacheStore,
  ) {}

  /**
   * 根据用户 ID 加载其所有角色下的权限，构建 CASL Ability。
   * 优先读缓存（规则列表），未命中时查库并写入缓存。
   */
  async createForUser(userId: string): Promise<AppAbility> {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const raw = await this.cache.get<string>(cacheKey);
    if (raw) {
      const cached = JSON.parse(raw) as PermissionRule[];
      return this.createFromRules(cached);
    }

    const rules = await this.loadPermissionRulesForUser(userId);
    await this.cache.set(cacheKey, JSON.stringify(rules), CACHE_TTL_MS);
    return this.createFromRules(rules);
  }

  /**
   * 从数据库加载用户的权限规则列表（仅 subject/action）。
   * 单次查询，User -> UserRole -> Role -> RolePermission -> Permission，无 N+1。
   */
  private async loadPermissionRulesForUser(
    userId: string,
  ): Promise<PermissionRule[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PERMISSIONS_SELECT,
    });

    if (!user) return [];

    const seen = new Set<string>();
    const rules: PermissionRule[] = [];
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        const { subject, action } = rp.permission;
        const key = `${action}:${subject}`;
        if (!seen.has(key)) {
          seen.add(key);
          rules.push({ action, subject });
        }
      }
    }
    return rules;
  }

  /**
   * 根据已有的权限规则列表构建 Ability，用于缓存命中或测试等非请求场景。
   */
  createFromRules(rules: PermissionRule[]): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
    for (const r of rules) {
      builder.can(r.action, r.subject);
    }
    return builder.build();
  }

  /**
   * 使指定用户的能力缓存失效（在分配/变更该用户角色后调用，可立即生效）。
   */
  async invalidateCacheForUser(userId: string): Promise<void> {
    await this.cache.del(`${CACHE_KEY_PREFIX}${userId}`);
  }
}
