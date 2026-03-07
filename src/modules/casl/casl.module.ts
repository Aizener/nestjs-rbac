import { Global, Module } from '@nestjs/common';

import { CaslAbilityFactory } from './casl-ability.factory';
import { CaslGuard } from './guards/casl.guard';

/**
 * CASL 能力与 RBAC 校验模块（全局）。
 * 提供：根据用户生成 Ability、守卫校验、装饰器声明所需权限。
 */
@Global()
@Module({
  providers: [CaslAbilityFactory, CaslGuard],
  exports: [CaslAbilityFactory, CaslGuard],
})
export class CaslModule {}
