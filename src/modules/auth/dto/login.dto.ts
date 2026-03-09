import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 登录 DTO：username、password 由 passport-local 校验，
 * rememberMe 为 true 时 token 有效期延长为 7 天
 */
export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username!: string;

  @ApiProperty({ description: '密码', example: 'Admin@123' })
  @IsString()
  @MinLength(4)
  password!: string;

  @ApiPropertyOptional({
    description: '勾选「记住我」时 token 有效期延长为 7 天',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  rememberMe?: boolean;
}
