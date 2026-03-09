import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeviceNameDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '设备名称最多 50 字符' })
  deviceName?: string;
}
