import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';

/** 对外返回的角色基础字段 */
const ROLE_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** 与 ROLE_SELECT 对应的返回类型 */
export type RoleResult = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

/** 角色 + 关联的权限列表（用于 GET :id/permissions） */
const ROLE_WITH_PERMISSIONS = {
  ...ROLE_SELECT,
  permissions: {
    select: {
      permissionId: true,
      permission: { select: { id: true, subject: true, action: true } },
    },
  },
} as const;

/** 与 ROLE_WITH_PERMISSIONS 对应的返回类型 */
export type RoleWithPermissionsResult = RoleResult & {
  permissions: {
    permissionId: string;
    permission: { id: string; subject: string; action: string };
  }[];
};

/**
 * 角色领域服务：Role CRUD、角色与权限的绑定（创建/更新/单独分配）。
 * 分配权限前会校验 permissionIds 均存在，避免外键错误。
 */
@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 全量角色列表，按名称排序 */
  async findAll(): Promise<RoleResult[]> {
    return this.prisma.role.findMany({
      select: ROLE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  /** 按主键查角色，不含权限列表 */
  async findOneById(id: string): Promise<RoleResult> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: ROLE_SELECT,
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  /** 按主键查角色并带上其下所有权限（subject/action），用于管理页展示 */
  async findOneByIdWithPermissions(
    id: string,
  ): Promise<RoleWithPermissionsResult> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: ROLE_WITH_PERMISSIONS,
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role as RoleWithPermissionsResult;
  }

  /** 校验 permissionIds 均存在，否则 404。用于 create/update/assignPermissions 前避免外键异常 */
  private async ensurePermissionIdsExist(
    permissionIds: string[],
  ): Promise<void> {
    if (permissionIds.length === 0) return;
    const rows = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });
    if (rows.length === permissionIds.length) return;
    const existingIds = new Set(rows.map((r) => r.id));
    const missing = permissionIds.filter((id) => !existingIds.has(id));
    throw new NotFoundException(`权限不存在: ${missing.join(', ')}`);
  }

  /** 创建角色，可选同时绑定权限；角色名重复则 409 */
  async create(dto: CreateRoleDto): Promise<RoleResult> {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('角色名已存在');
    }
    if (dto.permissionIds?.length) {
      await this.ensurePermissionIdsExist(dto.permissionIds);
    }
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        ...(dto.permissionIds?.length
          ? {
              permissions: {
                create: dto.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      select: ROLE_SELECT,
    });
    return role;
  }

  /** 整体替换角色（PUT）：必填 name，可选 permissionIds，权限列表整体替换 */
  async replace(id: string, dto: CreateRoleDto): Promise<RoleResult> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('角色不存在');
    const nameTaken = await this.prisma.role.findFirst({
      where: { name: dto.name, NOT: { id } },
    });
    if (nameTaken) {
      throw new ConflictException('角色名已存在');
    }
    await this.assignPermissions(id, dto.permissionIds ?? []);
    return this.prisma.role.update({
      where: { id },
      data: { name: dto.name },
      select: ROLE_SELECT,
    });
  }

  /**
   * 更新角色：可改名称和/或权限列表。
   * permissionIds 为 undefined 表示不修改权限；传数组则整体替换该角色的权限绑定。
   */
  async update(id: string, dto: UpdateRoleDto): Promise<RoleResult> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('角色不存在');
    if (dto.name != null) {
      const nameTaken = await this.prisma.role.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (nameTaken) {
        throw new ConflictException('角色名已存在');
      }
    }
    if (dto.permissionIds !== undefined) {
      await this.assignPermissions(id, dto.permissionIds);
    }
    const updateData: { name?: string } = {};
    if (dto.name != null) updateData.name = dto.name;
    return this.prisma.role.update({
      where: { id },
      data: updateData,
      select: ROLE_SELECT,
    });
  }

  /** 将角色的权限列表整体替换为 permissionIds（先删后插），用于 PUT :id/permissions */
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleResult> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('角色不存在');
    if (permissionIds.length > 0) {
      await this.ensurePermissionIdsExist(permissionIds);
    }
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
    return this.findOneById(roleId);
  }

  /** 删除角色；拥有该角色的用户通过 UserRole 级联解除，角色权限通过 RolePermission 级联删除 */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.role.delete({ where: { id } });
    } catch {
      throw new NotFoundException('角色不存在');
    }
  }
}
