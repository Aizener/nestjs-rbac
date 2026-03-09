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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

/**
 * 权限 REST 接口：对 Permission 的增删改查。
 */
@ApiTags('权限')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.Permission)
  @ApiOperation({ summary: '权限列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.Permission)
  @ApiOperation({ summary: '权限详情' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.Permission)
  @ApiOperation({ summary: '创建权限' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 409, description: 'subject+action 组合已存在' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.Permission)
  @ApiOperation({
    summary: '整体替换权限',
    description: 'body 同创建，必填 subject、action',
  })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  replace(@Param('id') id: string, @Body() dto: CreatePermissionDto) {
    return this.permissionsService.replace(id, dto);
  }

  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.Permission)
  @ApiOperation({ summary: '修改权限' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.Permission)
  @ApiOperation({ summary: '删除权限' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return { message: '删除成功' };
  }
}
