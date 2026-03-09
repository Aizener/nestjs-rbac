import { IsNotEmpty, IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建权限 DTO：CASL 约定下的一条权限 = 资源类型(subject) + 操作(action)。
 * 对应 ability.can(action, subject)，如 subject='Article' action='create'。
 */
export class CreatePermissionDto {
  @ApiProperty({
    description: '资源类型（subject）',
    example: 'User',
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty({ message: '资源类型不能为空' })
  @Length(1, 64, { message: '资源类型(subject) 长度必须在 1-64 之间' })
  subject!: string;

  @ApiProperty({
    description: '操作（action）',
    example: 'create',
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty({ message: '操作不能为空' })
  @Length(1, 64, { message: '操作(action) 长度必须在 1-64 之间' })
  action!: string;
}
