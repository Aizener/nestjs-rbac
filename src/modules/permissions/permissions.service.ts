import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { CreatePermissionDto } from './dto/create-permission.dto';
import type { UpdatePermissionDto } from './dto/update-permission.dto';

/** 对外返回的权限字段，不暴露内部关联 */
const PERMISSION_SELECT = {
  id: true,
  subject: true,
  action: true,
} as const;

/** 与 PERMISSION_SELECT 对应的返回类型，与 Prisma 查询结果一致 */
export type PermissionResult = {
  id: string;
  subject: string;
  action: string;
};

/**
 * 权限领域服务：对 Permission 表的 CRUD 及按 subject+action 查询。
 * 权限采用 CASL 约定：subject=资源类型，action=操作，对应 ability.can(action, subject)。
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 分页可选：当前为全量列表，按 subject、action 排序 */
  async findAll(): Promise<PermissionResult[]> {
    return this.prisma.permission.findMany({
      select: PERMISSION_SELECT,
      orderBy: [{ subject: 'asc' }, { action: 'asc' }],
    });
  }

  /** 按主键查询，不存在则 404 */
  async findOneById(id: string): Promise<PermissionResult> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: PERMISSION_SELECT,
    });
    if (!permission) throw new NotFoundException('权限不存在');
    return permission;
  }

  /** 按唯一约束 (subject, action) 查询，供创建前校验或业务使用 */
  async findBySubjectAction(
    subject: string,
    action: string,
  ): Promise<PermissionResult | null> {
    return this.prisma.permission.findUnique({
      where: { subject_action: { subject, action } },
      select: PERMISSION_SELECT,
    });
  }

  /** 创建权限，subject+action 重复则 409 */
  async create(dto: CreatePermissionDto): Promise<PermissionResult> {
    const existing = await this.prisma.permission.findUnique({
      where: { subject_action: { subject: dto.subject, action: dto.action } },
    });
    if (existing) {
      throw new ConflictException('该 subject+action 权限已存在');
    }
    return this.prisma.permission.create({
      data: { subject: dto.subject, action: dto.action },
      select: PERMISSION_SELECT,
    });
  }

  /** 整体替换权限（PUT）：必填 subject、action */
  async replace(
    id: string,
    dto: CreatePermissionDto,
  ): Promise<PermissionResult> {
    const existing = await this.prisma.permission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('权限不存在');
    const duplicate = await this.prisma.permission.findFirst({
      where: {
        subject: dto.subject,
        action: dto.action,
        NOT: { id },
      },
    });
    if (duplicate) {
      throw new ConflictException('该 subject+action 权限已存在');
    }
    return this.prisma.permission.update({
      where: { id },
      data: { subject: dto.subject, action: dto.action },
      select: PERMISSION_SELECT,
    });
  }

  /** 更新权限；若修改 subject/action 导致与其它记录重复则 409 */
  async update(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionResult> {
    const existing = await this.prisma.permission.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('权限不存在');
    if (dto.subject != null || dto.action != null) {
      const subject = dto.subject ?? existing.subject;
      const action = dto.action ?? existing.action;
      const duplicate = await this.prisma.permission.findFirst({
        where: {
          subject,
          action,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException('该 subject+action 权限已存在');
      }
    }
    return this.prisma.permission.update({
      where: { id },
      data: { subject: dto.subject, action: dto.action },
      select: PERMISSION_SELECT,
    });
  }

  /** 删除权限；被角色引用时由外键级联处理，此处仅保证不存在时 404 */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.permission.delete({ where: { id } });
    } catch {
      throw new NotFoundException('权限不存在');
    }
  }
}
