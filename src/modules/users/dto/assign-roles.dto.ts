import { IsArray, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({
    description: '角色 ID 列表（整体替换）',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true, message: '角色 ID 列表须为 UUID 数组' })
  roleIds!: string[];
}
