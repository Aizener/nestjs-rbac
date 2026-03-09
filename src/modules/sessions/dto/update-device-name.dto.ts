import { IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeviceNameDto {
  @ApiPropertyOptional({
    description: '设备名称',
    example: '我的手机',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '设备名称最多 50 字符' })
  deviceName?: string;
}
