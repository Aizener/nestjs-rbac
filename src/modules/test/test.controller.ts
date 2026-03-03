import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';

import { TestService } from './test.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService, private authService: AuthService) {}

  @Get()
  getHello(): { msg: string } {
    return this.testService.getHello();
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    console.log('req login', req.user);
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    console.log('req profile', req.user);
    return req.user;
  }
}
