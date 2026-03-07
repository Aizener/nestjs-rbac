import type { Request } from 'express';

import { Controller, Post, Req, UseGuards } from '@nestjs/common';

import {
  AuthService,
  AuthUser,
  LogoutAllResult,
  LogoutResult,
  TokenPair,
} from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: Request & { user: AuthUser }): Promise<TokenPair> {
    const ip = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = req.get?.('User-Agent') ?? undefined;
    return this.authService.login(req.user, { ip, userAgent });
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
