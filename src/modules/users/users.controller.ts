import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppAction, AppSubject } from '../casl/constants/ability.constants';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CaslGuard } from '../casl/guards/casl.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, CaslGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.User)
  async findAll() {
    return this.usersService.findAll();
  }

  /** 当前用户修改自己的资料（仅需登录，不要求 update User 权限） */
  @Patch('me')
  updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, dto);
  }

  @Put(':id/roles')
  @CheckAbility(AppAction.update, AppSubject.User)
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto);
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.User)
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.User)
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** 整体替换指定用户（需 update User 权限），body 同创建：必填 username、password */
  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.User)
  replace(@Param('id') id: string, @Body() dto: CreateUserDto) {
    return this.usersService.replace(id, dto);
  }

  /** 修改指定用户（需 update User 权限，改自己也可用 PATCH /users/me） */
  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.User)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.User)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: '删除成功' };
  }
}
