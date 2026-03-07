import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

/** 更新角色 DTO：可只改名称或只改权限；permissionIds 传空数组表示清空该角色所有权限 */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(1, 64, { message: '角色名长度必须在 1-64 之间' })
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: '权限 ID 列表须为 UUID 数组' })
  permissionIds?: string[];
}
