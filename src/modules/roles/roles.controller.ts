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
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

/**
 * 角色 REST 接口：Role CRUD、查询角色下的权限、整体覆盖角色权限。
 */
@ApiTags('角色')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, CaslGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.Role)
  @ApiOperation({ summary: '角色列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id/permissions')
  @CheckAbility(AppAction.read, AppSubject.Role)
  @ApiOperation({
    summary: '角色详情（含权限）',
    description: '获取角色详情并包含其下所有权限（subject/action）',
  })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  findOneWithPermissions(@Param('id') id: string) {
    return this.rolesService.findOneByIdWithPermissions(id);
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.Role)
  @ApiOperation({ summary: '角色详情' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.Role)
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 409, description: '角色名已存在' })
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.Role)
  @ApiOperation({
    summary: '整体替换角色',
    description: 'body 同创建，必填 name，可选 permissionIds',
  })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  replace(@Param('id') id: string, @Body() dto: CreateRoleDto) {
    return this.rolesService.replace(id, dto);
  }

  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.Role)
  @ApiOperation({ summary: '修改角色' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Put(':id/permissions')
  @CheckAbility(AppAction.update, AppSubject.Role)
  @ApiOperation({
    summary: '分配权限',
    description: '整体覆盖该角色的权限列表',
  })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto.permissionIds);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.Role)
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return { message: '删除成功' };
  }
}
