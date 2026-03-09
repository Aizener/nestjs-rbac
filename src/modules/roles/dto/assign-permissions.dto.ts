import { IsArray, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/** PUT /roles/:id/permissions 的 body：用 permissionIds 整体替换该角色的权限 */
export class AssignPermissionsDto {
  @ApiProperty({ description: '权限 ID 列表（整体替换）', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true, message: '权限 ID 列表须为 UUID 数组' })
  permissionIds!: string[];
}
