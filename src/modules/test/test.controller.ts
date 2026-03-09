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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthUser, TokenPair } from '../auth/auth.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { TestService } from './test.service';

type RequestWithUser = Request & { user: AuthUser };

@ApiTags('测试/调试')
@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '成功' })
  getHello(): { msg: string } {
    return this.testService.getHello();
  }

  @Get('prisma')
  @ApiOperation({ summary: 'Prisma 测试', description: '调试用，返回所有用户' })
  @ApiResponse({ status: 200, description: '成功' })
  async getPrisma(): Promise<{ msg: string; users: User[] }> {
    const users = await this.prismaService.user.findMany();
    return { msg: `Found ${users.length} users`, users };
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @ApiOperation({
    summary: '测试登录',
    description: '与 /auth/login 相同，调试用',
  })
  @ApiResponse({ status: 201, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Req() req: RequestWithUser): Promise<TokenPair> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '测试 profile', description: '返回当前用户信息' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录' })
  getProfile(@Req() req: RequestWithUser): AuthUser {
    return req.user;
  }

  @Get('cache')
  @ApiOperation({
    summary: '查看缓存',
    description: '调试用，根据 key 查看缓存值',
  })
  @ApiQuery({
    name: 'key',
    description: '缓存 key',
    example: 'access_token:userId:jti',
  })
  @ApiResponse({ status: 200, description: '成功' })
  async getCache(@Query('key') key: string) {
    const value = await this.cacheManager.get(key);
    return { key, value: value ?? null };
  }

  @Get('cache/all')
  @ApiOperation({ summary: '查看所有缓存', description: '调试用' })
  @ApiResponse({ status: 200, description: '成功' })
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
