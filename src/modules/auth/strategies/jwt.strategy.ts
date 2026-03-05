import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from 'src/config';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService } from '../auth.service';

const extractBearerToken = ExtractJwt.fromAuthHeaderAsBearerToken();

/**
 * JWT 校验：验证签名与过期 + 缓存匹配
 * 缓存存在且与请求 token 一致才放行，支持立即撤销
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: extractBearerToken,
      ignoreExpiration: false,
      secretOrKey: env.JWT_CONSTANTS,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: { sub: number; username: string; jti: string },
  ) {
    const { sub, username, jti } = payload;
    if (!jti) throw new UnauthorizedException('Invalid token');

    const token = extractBearerToken(req);
    if (!token) throw new UnauthorizedException('Token not found');

    const valid = await this.authService.validateAccessToken(sub, jti, token);
    if (!valid) {
      throw new UnauthorizedException('Token not found in cache or revoked');
    }
    return { userId: sub, username, jti };
  }
}
