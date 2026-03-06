import type { Cache } from 'cache-manager';
import type { Request } from 'express';
import { User } from 'generated/prisma/client';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Request as Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthUser, TokenPair } from '../auth/auth.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { TestService } from './test.service';

type RequestWithUser = Request & { user: AuthUser };

@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  getHello(): { msg: string } {
    return this.testService.getHello();
  }

  @Get('prisma')
  async getPrisma(): Promise<{ msg: string; users: User[] }> {
    const users = await this.prismaService.user.findMany();
    return { msg: `Found ${users.length} users`, users };
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Req() req: RequestWithUser): Promise<TokenPair> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser): AuthUser {
    return req.user;
  }

  /** 调试：根据 key 查看缓存值，如 ?key=access_token:1:jti 或 ?key=user_sessions:1 */
  @Get('cache')
  async getCache(@Query('key') key: string) {
    const value = await this.cacheManager.get(key);
    return { key, value: value ?? null };
  }

  /** 调试：查看所有缓存条目 */
  @Get('cache/all')
  async getAllCache(): Promise<Record<string, unknown>> {
    const cache = this.cacheManager as {
      stores?: Array<{ iterator?: () => AsyncGenerator<[string, unknown]> }>;
    };
    const store = cache.stores?.[0];
    if (!store?.iterator) {
      return {};
    }
    const entries: Record<string, unknown> = {};
    for await (const [key, value] of store.iterator()) {
      entries[key] = value;
    }
    return entries;
  }
}
