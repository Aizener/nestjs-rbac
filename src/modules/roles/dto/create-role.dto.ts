import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

/** 创建角色 DTO：必填角色名，可选创建时即绑定一批权限 ID */
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: '角色名不能为空' })
  @Length(1, 64, { message: '角色名长度必须在 1-64 之间' })
  name: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: '权限 ID 列表须为 UUID 数组' })
  permissionIds?: string[];
}
