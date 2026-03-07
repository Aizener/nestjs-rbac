import { IsArray, IsUUID } from 'class-validator';

/** PUT /roles/:id/permissions 的 body：用 permissionIds 整体替换该角色的权限 */
export class AssignPermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true, message: '权限 ID 列表须为 UUID 数组' })
  permissionIds: string[];
}
