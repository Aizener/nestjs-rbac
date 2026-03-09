import { PartialType } from '@nestjs/swagger';

import { CreatePermissionDto } from './create-permission.dto';

/** 更新权限 DTO：subject/action 均为可选，仅传需修改字段 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
