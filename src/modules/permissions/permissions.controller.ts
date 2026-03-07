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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

/**
 * 权限 REST 接口：对 Permission 的增删改查。
 * subject/action 与 CASL 及角色-权限分配一致，可在角色管理里绑定到角色。
 */
@Controller('permissions')
@UseGuards(JwtAuthGuard, CaslGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @CheckAbility(AppAction.read, AppSubject.Permission)
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @CheckAbility(AppAction.read, AppSubject.Permission)
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOneById(id);
  }

  @Post()
  @CheckAbility(AppAction.create, AppSubject.Permission)
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  /** 整体替换权限（PUT），body 同创建：必填 subject、action */
  @Put(':id')
  @CheckAbility(AppAction.update, AppSubject.Permission)
  replace(
    @Param('id') id: string,
    @Body() dto: CreatePermissionDto,
  ) {
    return this.permissionsService.replace(id, dto);
  }

  @Patch(':id')
  @CheckAbility(AppAction.update, AppSubject.Permission)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @CheckAbility(AppAction.delete, AppSubject.Permission)
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return { message: '删除成功' };
  }
}
