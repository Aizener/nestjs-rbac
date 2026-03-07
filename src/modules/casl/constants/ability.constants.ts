/**
 * CASL 与 Permission 表一致的 action/subject 枚举，用于 @CheckAbility 与 seed 等，避免字面量拼写错误。
 */

/** 操作类型，与 DB Permission.action 及 CASL 约定一致 */
export enum AppAction {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  manage = 'manage',
}

/** 资源类型，与 DB Permission.subject 及 CASL 约定一致；新增模块时在此追加 */
export enum AppSubject {
  User = 'User',
  Role = 'Role',
  Permission = 'Permission',
}
