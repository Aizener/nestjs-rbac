/**
 * 从用户角色中提取去重权限的公共逻辑。
 * 被 AuthService.getMe 与 CaslAbilityFactory.loadPermissionRulesForUser 复用。
 */

/** 去重后的权限规则，与 CASL 及 DB Permission 表一致 */
export type PermissionRule = { subject: string; action: string };

/** 用户角色权限嵌套结构（UserRole -> Role -> RolePermission -> Permission） */
export type UserRolesWithPermissions = {
  roles: Array<{
    role: {
      permissions: Array<{
        permission: { subject: string; action: string };
      }>;
    };
  }>;
};

/**
 * 从用户角色关联中提取去重后的权限列表（subject + action）
 * @param user - 含 roles 的用户对象（Prisma select 结果）
 * @returns 去重后的权限规则数组，按首次出现顺序
 */
export function extractPermissionRules(
  user: UserRolesWithPermissions,
): PermissionRule[] {
  const seen = new Set<string>();
  const result: PermissionRule[] = [];
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      const { subject, action } = rp.permission;
      const key = `${action}:${subject}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ subject, action });
      }
    }
  }
  return result;
}
