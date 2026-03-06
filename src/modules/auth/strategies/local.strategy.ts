import { Strategy } from 'passport-local';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AuthService, AuthUser } from '../auth.service';

/**
 * 本地认证策略
 * 使用 passport-local 策略处理用户名/密码登录
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * 验证用户凭据
   * Passport 会自动调用此方法进行认证
   * 验证通过的用户将被挂载到 Request 对象上 (req.user)
   * @param username - 用户名
   * @param password - 密码
   * @returns 验证通过的用户对象（不含密码）
   * @throws UnauthorizedException 当凭据无效时抛出
   */
  async validate(username: string, password: string): Promise<AuthUser> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}
