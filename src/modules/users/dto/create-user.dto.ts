import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(4, 20, { message: '用户名长度必须在 4-20 之间' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(4, 20, { message: '密码长度必须在 4-20 之间' })
  password: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}
