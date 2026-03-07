import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  AppAction,
  AppSubject,
} from '../casl/constants/ability.constants';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CaslGuard } from '../casl/guards/casl.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

/**
 * 角色 REST 接口：Role CRUD、查询角色下的权限、整体覆盖角色权限。
 * 与 Permissions、Users（分配角色）配合完成 RBAC 配置。
 */
@Controller('roles')
@UseGuards(JwtAuthGuard, CaslGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.Role)
  async findAll() {
    return this.rolesService.findAll();
  }

  /** 获取角色详情并包含其下所有权限（subject/action），路由需在 :id 之前以优先匹配 */
  @Get(':id/permissions')
  @CheckAbility(AppAction.read, AppSubject.Role)
  findOneWithPermissions(@Param('id') id: string) {
    return this.rolesService.findOneByIdWithPermissions(id);
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.Role)
  findOne(@Param('id') id: string) {
    return this.rolesService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.Role)
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  /** 整体替换角色（PUT），body 同创建：必填 name，可选 permissionIds */
  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.Role)
  replace(@Param('id') id: string, @Body() dto: CreateRoleDto) {
    return this.rolesService.replace(id, dto);
  }

  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.Role)
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  /** 整体覆盖该角色的权限列表（替换为 body.permissionIds） */
  @Put(':id/permissions')
  @CheckAbility(AppAction.update, AppSubject.Role)
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto.permissionIds);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.Role)
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return { message: '删除成功' };
  }
}
