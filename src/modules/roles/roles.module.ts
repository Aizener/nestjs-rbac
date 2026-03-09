import { Module } from '@nestjs/common';

import { CaslModule } from '../casl/casl.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

/** 角色模块：Role CRUD、角色-权限绑定，与 Permissions/Users 组成 RBAC */
@Module({
  imports: [CaslModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
