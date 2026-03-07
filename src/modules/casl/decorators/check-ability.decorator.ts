import { SetMetadata } from '@nestjs/common';

import type { AppAction, AppSubject } from '../constants/ability.constants';

/** Reflector 使用的 metadata key，与 CaslGuard 一致 */
export const CHECK_ABILITY_KEY = 'check_ability';

/** 单条权限要求：CASL 的 action + subject */
export interface CheckAbilityOption {
  action: string;
  subject: string;
}

/**
 * 在控制器方法（或类）上声明访问所需权限：action + subject（与 DB Permission 表一致）。
 * 与 CaslGuard 配合使用；未使用本装饰器时 CaslGuard 不进行权限校验。
 * 建议使用 AppAction / AppSubject 枚举，避免字面量拼写错误。
 *
 * @example
 * @CheckAbility(AppAction.create, AppSubject.User)
 * @Post()
 * create(@Body() dto: CreateUserDto) { ... }
 */
export const CheckAbility = (
  action: AppAction | string,
  subject: AppSubject | string,
) => SetMetadata(CHECK_ABILITY_KEY, { action, subject } as CheckAbilityOption);
