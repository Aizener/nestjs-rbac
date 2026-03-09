import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'user01',
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(4, 20, { message: '用户名长度必须在 4-20 之间' })
  username!: string;

  @ApiProperty({
    description: '密码',
    example: 'Pass@123',
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(4, 20, { message: '密码长度必须在 4-20 之间' })
  password!: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}
