# AGENTS.md

面向 AI Agent 的项目说明，帮助快速理解代码结构与约定。

---

## 项目概述

基于 **NestJS 11** 的 RBAC（基于角色的访问控制）模板，适用于中小型 SaaS 或后台管理系统。核心链路：**User → UserRole → Role → RolePermission → Permission**。

---

## 技术栈

| 类别     | 技术 |
|----------|------|
| 框架     | NestJS 11 |
| 数据库   | PostgreSQL + Prisma 7 |
| 认证     | JWT（@nestjs/jwt + passport-jwt） |
| 权限     | CASL (@casl/ability) |
| 校验     | Zod（环境变量）+ class-validator（DTO） |
| 文档     | Swagger (@nestjs/swagger) |
| 缓存     | @nestjs/cache-manager + Keyv |

环境要求：Node.js 22+。`.env` 示例见项目根目录 `.env.example`。

---

## 目录结构

```
src/
├── config/           # 配置（env 校验在此）
│   ├── env.config.ts # Zod 校验，所有 env 必须在此声明
│   └── index.ts
├── common/           # 公共工具
│   └── permission.util.ts  # extractPermissionRules，权限去重
├── modules/
│   ├── auth/         # 认证：login/logout/me
│   ├── casl/         # CASL 权限策略、Guard、装饰器
│   ├── users/        # 用户 CRUD
│   ├── roles/        # 角色 CRUD
│   ├── permissions/  # 权限 CRUD
│   ├── sessions/     # 会话管理
│   ├── prisma/       # PrismaService
│   └── test/         # 示例模块
├── app.module.ts
└── main.ts
```

---

## 重要约定

### 1. 环境变量

- **必须** 通过 `src/config/env.config.ts` 的 Zod schema 声明
- **禁止** 直接使用 `process.env.XXX`，统一使用 `import { env } from 'src/config'` 或 `'../../config/env.config'`
- 当前必填：`PORT`、`ALLOWED_ORIGINS`、`JWT_CONSTANTS`、`DATABASE_URL`

### 2. 权限声明

- 使用 `@CheckAbility(action, subject)` 声明所需权限
- `action` / `subject` 使用 `AppAction`、`AppSubject` 枚举（`src/modules/casl/constants/ability.constants.ts`）
- 新增资源时：在 `AppSubject` 中追加，并在 `prisma/seed.ts` 的 `PERMISSIONS_BY_SUBJECT` 中配置

### 3. DTO 校验

- 使用 class-validator 装饰器
- 更新 DTO 时，`PartialType` 从 `@nestjs/swagger` 导入（便于文档生成）

### 4. API 路径

- 全局前缀：`/api`
- 版本：URI 版本，默认 v1
- 实际路径示例：`/api/v1/auth/login`、`/api/v1/users`

### 5. Swagger

- 文档地址：`/api/docs`
- Controller 使用 `@ApiTags`、`@ApiOperation`、`@ApiResponse`、`@ApiBearerAuth` 等
- DTO 使用 `@ApiProperty` / `@ApiPropertyOptional`

---

## 代码风格

- 引号：单引号
- 尾随逗号：所有情况使用
- 导入排序：`@nestjs/*` → `src/` 或相对路径 → `./` 或 `../`
- 目标：ES2022，模块 NodeNext

---

## TypeScript / ESLint

- `strictNullChecks: true`，`noImplicitAny: false`
- `no-explicit-any` 关闭，`no-floating-promises` 警告
- 测试文件：`*.spec.ts`，与源码同目录，Jest

---

## 认证与权限流程

1. **登录**：`POST /api/v1/auth/login`（LocalAuthGuard）→ 返回 `access_token`
2. **受保护接口**：`JwtAuthGuard` 校验 JWT → `CaslGuard` 校验 `@CheckAbility`
3. **获取当前用户**：`GET /api/v1/auth/me`（仅需 JWT，无权限校验）

---

## CASL 相关

- **CaslAbilityFactory**：根据用户角色构建 ability，带缓存
- **CaslGuard**：读取 `@CheckAbility` 元数据，调用 `ability.can(action, subject)`
- **角色权限变更**：`RolesService.assignPermissions` 会调用 `caslAbility.invalidateCacheForRole(roleId)` 使缓存失效

---

## 数据库

- Prisma schema：`prisma/schema.prisma`
- 迁移：`npx prisma migrate dev`
- 种子：`npx prisma db seed`（初始化 Permission、Role、超级管理员）
- PrismaService 使用 `env.DATABASE_URL`，不直接读 `process.env`

---

## 常用命令

```bash
npm install          # 安装依赖
npm run start:dev    # 开发（http://localhost:3000，文档 /api/docs）
npm run build        # 构建
npm run lint         # ESLint 检查并修复
npm run format       # Prettier 格式化
npm test             # 测试
npx prisma generate  # 生成 Prisma 客户端
npx prisma migrate dev  # 迁移
npx prisma db seed   # 种子数据
```

---

## 修改时注意

1. **新增 env 变量**：在 `env.config.ts` 的 schema 和 export 中同时添加
2. **新增受保护接口**：加 `@UseGuards(JwtAuthGuard, CaslGuard)` 和 `@CheckAbility`
3. **新增资源类型**：更新 `AppSubject`、`PERMISSIONS_BY_SUBJECT`、seed
4. **角色权限变更**：确保调用 `invalidateCacheForRole`，避免权限滞后

---

## 项目阶段

- **v0.1** ✅：用户、角色、权限、JWT、CASL
- **v0.2** 🚧：Redis 缓存、超级管理员、Swagger、会话管理
- **v1.0**：企业级 RBAC、审计日志、动态权限、数据隔离

---

## 参考文档

- 用户文档：`README.md`
