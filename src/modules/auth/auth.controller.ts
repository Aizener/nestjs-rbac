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
  AuthService,
  AuthUser,
  LogoutAllResult,
  LogoutResult,
  MeResult,
  TokenPair,
} from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 获取当前登录用户信息（含角色、权限）
   * 仅需 JWT 有效即可，不要求 read User 权限，供前端渲染菜单、按钮等
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request & { user: AuthUser }): Promise<MeResult> {
    const me = await this.authService.getMe(req.user.userId);
    if (!me) {
      throw new NotFoundException('用户不存在或已删除');
    }
    return me;
  }

  /**
   * 登录，body: { username, password, rememberMe? }
   * rememberMe 为 true 时 token 有效期延长为 7 天
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
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
  async logout(
    @Req() req: Request & { user: AuthUser & { jti: string } },
  ): Promise<LogoutResult> {
    return this.authService.logout(req.user.userId, req.user.jti);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() req: Request & { user: AuthUser },
  ): Promise<LogoutAllResult> {
    return this.authService.logoutAll(req.user.userId);
  }
}
