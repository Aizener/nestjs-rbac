import { Controller, Post, Request, UseGuards } from '@nestjs/common';

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
  async login(
    @Request() req: Request & { user: AuthUser },
  ): Promise<TokenPair> {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: Request & { user: AuthUser & { jti: string } },
  ): Promise<LogoutResult> {
    return this.authService.logout(req.user.userId, req.user.jti);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Request() req: Request & { user: AuthUser },
  ): Promise<LogoutAllResult> {
    return this.authService.logoutAll(req.user.userId);
  }
}
