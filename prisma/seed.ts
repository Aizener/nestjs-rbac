/**
 * Prisma 种子：初始化 Permission、Role、RolePermission 及超级管理员用户。
 * 执行：npx prisma db seed（由 prisma.config.ts 的 migrations.seed 调用 tsx 运行）
 */
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

import { PrismaClient } from '../generated/prisma/client';
import { env } from '../src/config/env.config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
  }),
});

/** 按资源定义操作列表，新增模块在此追加。manage 表示该资源的全部操作（CASL 约定） */
const PERMISSIONS_BY_SUBJECT: Record<string, string[]> = {
  User: ['create', 'read', 'update', 'delete', 'manage'],
  Role: ['create', 'read', 'update', 'delete', 'manage'],
  Permission: ['create', 'read', 'update', 'delete', 'manage'],
};

/** 初始角色：name -> 该角色拥有的 (subject, action) 列表，空数组表示不自动分配权限 */
const ROLES: {
  name: string;
  permissions: { subject: string; action: string }[];
}[] = [
  { name: 'admin', permissions: [] }, // 空表示“全部权限”，下面会赋所有 permission
  {
    name: 'member',
    permissions: [
      { subject: 'User', action: 'read' },
      { subject: 'Role', action: 'read' },
      { subject: 'Permission', action: 'read' },
    ],
  },
];

/** 超级管理员账号（拥有 admin 角色即全部权限），首次部署后请修改密码 */
const SUPER_ADMIN = {
  username: 'admin',
  password: 'Admin@123',
  email: 'admin@example.com' as string | undefined,
};

async function main() {
  // 1. 初始化权限表（已有则跳过）
  const permissionPairs = Object.entries(PERMISSIONS_BY_SUBJECT).flatMap(
    ([subject, actions]) => actions.map((action) => ({ subject, action })),
  );
  await prisma.permission.createMany({
    data: permissionPairs,
    skipDuplicates: true,
  });

  // 2. 初始化角色表（已有则跳过）
  await prisma.role.createMany({
    data: ROLES.map((r) => ({ name: r.name })),
    skipDuplicates: true,
  });

  // 3. 为 admin 分配全部权限
  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });
  const admin = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (admin && allPermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: admin.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // 4. 为 member 等其它角色按 ROLES 配置分配指定权限（当前 member 无配置则跳过）
  for (const roleDef of ROLES) {
    if (roleDef.name === 'admin' || roleDef.permissions.length === 0) continue;
    const role = await prisma.role.findUnique({
      where: { name: roleDef.name },
    });
    if (!role) continue;
    const ids: string[] = [];
    for (const { subject, action } of roleDef.permissions) {
      const p = await prisma.permission.findUnique({
        where: { subject_action: { subject, action } },
        select: { id: true },
      });
      if (p) ids.push(p.id);
    }
    if (ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: ids.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }

  // 5. 超级管理员用户（拥有 admin 角色 = 全部权限），已存在则仅确保绑定 admin 角色
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
    const hashedPassword = await argon2.hash(SUPER_ADMIN.password);
    const superAdmin = await prisma.user.upsert({
      where: { username: SUPER_ADMIN.username },
      update: {},
      create: {
        username: SUPER_ADMIN.username,
        password: hashedPassword,
        email: SUPER_ADMIN.email,
      },
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: superAdmin.id, roleId: adminRole.id },
      },
      update: {},
      create: { userId: superAdmin.id, roleId: adminRole.id },
    });
    console.log(`Super admin user: ${SUPER_ADMIN.username} (role: admin).`);
  }

  console.log('Seed done: permissions, roles & super admin initialized.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
