import { IsArray, IsUUID } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @IsUUID('4', { each: true, message: '角色 ID 列表须为 UUID 数组' })
  roleIds: string[];
}
