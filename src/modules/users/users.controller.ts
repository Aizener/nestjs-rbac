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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppAction, AppSubject } from '../casl/constants/ability.constants';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CaslGuard } from '../casl/guards/casl.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('用户')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, CaslGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.User)
  @ApiOperation({ summary: '用户列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch('me')
  @ApiOperation({
    summary: '修改当前用户资料',
    description: '仅需登录，不要求 update User 权限',
  })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录' })
  updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.userId, dto);
  }

  @Put(':id/roles')
  @CheckAbility(AppAction.update, AppSubject.User)
  @ApiOperation({ summary: '分配角色', description: '整体替换用户的角色列表' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto);
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.User)
  @ApiOperation({ summary: '用户详情' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.User)
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.User)
  @ApiOperation({
    summary: '整体替换用户',
    description: 'body 同创建，必填 username、password',
  })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  replace(@Param('id') id: string, @Body() dto: CreateUserDto) {
    return this.usersService.replace(id, dto);
  }

  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.User)
  @ApiOperation({
    summary: '修改用户',
    description: '改自己也可用 PATCH /users/me',
  })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.User)
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: '删除成功' };
  }
}
