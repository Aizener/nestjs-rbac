import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CaslAbilityFactory } from '../casl-ability.factory';
import {
  CHECK_ABILITY_KEY,
  type CheckAbilityOption,
} from '../decorators/check-ability.decorator';

/**
 * CASL 权限守卫：根据当前用户（req.user.userId）构建 Ability，并校验是否具备
 * 方法或类上通过 @CheckAbility(action, subject) 声明的权限。
 *
 * 使用顺序：应先挂 JwtAuthGuard 再挂 CaslGuard，保证 request.user 已存在。
 * 若未声明 @CheckAbility，则不做权限校验，直接放行。
 */
@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbility: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<
      CheckAbilityOption | undefined
    >(CHECK_ABILITY_KEY, [context.getHandler(), context.getClass()]);

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string } | undefined;
    if (!user?.userId) {
      throw new ForbiddenException('未登录或登录已失效');
    }

    const ability = await this.caslAbility.createForUser(user.userId);
    const allowed =
      ability.can(requirement.action, requirement.subject) ||
      ability.can('manage', requirement.subject);
    if (!allowed) {
      throw new ForbiddenException(`无权限执行`);
    }
    return true;
  }
}
