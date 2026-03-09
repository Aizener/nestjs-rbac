import type { Request } from 'express';

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthService,
  AuthUser,
  LogoutAllResult,
  LogoutResult,
  MeResult,
  TokenPair,
} from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户信息',
    description:
      '返回当前登录用户信息（含角色、权限），供前端渲染菜单、按钮等，仅需 JWT 有效',
  })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录或 token 失效' })
  async getMe(@Req() req: Request & { user: AuthUser }): Promise<MeResult> {
    const me = await this.authService.getMe(req.user.userId);
    if (!me) {
      throw new NotFoundException('用户不存在或已删除');
    }
    return me;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: '登录',
    description:
      '用户名密码登录，rememberMe 为 true 时 token 有效期延长为 7 天',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: '登录成功，返回 access_token' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(
    @Req() req: Request & { user: AuthUser },
    @Body('rememberMe') rememberMe?: boolean | string,
  ): Promise<TokenPair> {
    const ip = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = req.get?.('User-Agent') ?? undefined;
    const isRememberMe = rememberMe === true || rememberMe === 'true';
    return this.authService.login(req.user, {
      ip,
      userAgent,
      rememberMe: isRememberMe,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出当前设备' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未登录或 token 失效' })
  async logout(
    @Req() req: Request & { user: AuthUser & { jti: string } },
  ): Promise<LogoutResult> {
    return this.authService.logout(req.user.userId, req.user.jti);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出全部设备' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未登录或 token 失效' })
  async logoutAll(
    @Req() req: Request & { user: AuthUser },
  ): Promise<LogoutAllResult> {
    return this.authService.logoutAll(req.user.userId);
  }
}
