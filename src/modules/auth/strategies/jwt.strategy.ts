import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { env } from 'src/config';

/**
 * JWT 认证策略
 * 使用 passport-jwt 策略处理 JWT Token 验证
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_CONSTANTS,
    });
  }

  /**
   * 验证 JWT Token 并解析用户信息
   * Passport 会自动调用此方法进行认证
   * 验证通过的用户将被挂载到 Request 对象上 (req.user)
   * @param payload - JWT Token 中的载荷（包含 sub 和 username）
   * @returns 解析后的用户信息（userId 和 username）
   */
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
