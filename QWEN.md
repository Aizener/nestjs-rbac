# NestJS RBAC Template - QWEN.md

## 项目概述

这是一个基于 **NestJS 11** 的 RBAC（Role-Based Access Control，基于角色的访问控制）基础模板项目，适用于中小型 SaaS 或后台管理系统。项目目标是提供清晰的分层结构、可扩展的权限系统，适合用作求职展示项目。

### 核心技术栈

- **框架**: NestJS 11.0.1
- **语言**: TypeScript 5.7.3
- **数据校验**: Zod 4.3.6
- **身份认证**: JWT（计划中）
- **数据库**: PostgreSQL + Prisma（可选）
- **构建工具**: Nest CLI 11.0.0
- **测试框架**: Jest 30.0.0
- **代码规范**: ESLint 9.18.0 + Prettier 3.4.2

### 项目架构

```
src/
 ├── modules/          # 业务模块
 │    ├── auth/        # 认证模块（计划）
 │    ├── user/        # 用户模块（计划）
 │    ├── role/        # 角色模块（计划）
 │    ├── permission/  # 权限模块（计划）
 │    └── rbac/        # RBAC 核心模块（计划）
 │    └── test/        # 测试模块（当前唯一实现）
 │
 ├── common/           # 公共组件
 │    ├── decorators/  # 自定义装饰器
 │    ├── guards/      # 守卫
 │    └── pipes/       # 管道
 │
 ├── config/           # 配置
 │    ├── env.config.ts # 环境变量配置（Zod 校验）
 │    └── index.ts     # 配置导出
 │
 ├── app.module.ts     # 根模块
 └── main.ts           # 应用入口
```

### RBAC 数据模型设计

```
User → UserRole → Role → RolePermission → Permission
```

- **User**: 用户（id, email, password）
- **Role**: 角色（id, name）如 admin, editor, user
- **Permission**: 权限（id, name）如 user:create, user:update
- **UserRole**: 用户 - 角色关联表
- **RolePermission**: 角色 - 权限关联表

## 开发与运行

### 环境要求

- Node.js 22+
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run start:dev
```

默认访问地址：`http://localhost:3000`

### 生产模式

```bash
npm run build
npm run start:prod
```

### 调试模式

```bash
npm run start:debug
```

### 测试

```bash
npm test              # 运行测试
npm run test:watch    # 监听模式
npm run test:cov      # 覆盖率
npm run test:e2e      # 端到端测试
```

### 代码规范

```bash
npm run lint          # ESLint 检查并自动修复
npm run format        # Prettier 格式化
```

### 构建

```bash
npm run build
```

输出目录：`dist/`

## 开发规范

### 代码风格

1. **引号**: 使用单引号（`singleQuote: true`）
2. **尾随逗号**: 所有情况都使用尾随逗号（`trailingComma: 'all'`）
3. **导入排序**: 使用 Prettier 插件自动排序
   - 第一组：`@nestjs/*`
   - 第二组：`@/*`（项目别名）
   - 第三组：相对路径 `./` 或 `../`
4. **目标版本**: ES2023
5. **模块系统**: NodeNext

### TypeScript 配置特点

- 启用装饰器元数据发射（`emitDecoratorMetadata: true`）
- 启用实验性装饰器（`experimentalDecorators: true`）
- 严格空检查（`strictNullChecks: true`）
- 禁止隐式 any（`noImplicitAny: false`）
- 生成 Source Map（`sourceMap: true`）

### ESLint 规则

- `@typescript-eslint/no-explicit-any`: 关闭
- `@typescript-eslint/no-floating-promises`: 警告
- `@typescript-eslint/no-unsafe-argument`: 警告
- Prettier 格式化：错误级别

### 模块组织原则

1. **模块职责单一**: 每个模块只负责一个业务领域
2. **权限系统独立**: RBAC 模块独立于业务模块
3. **Guard + Decorator 解耦**: 使用装饰器声明权限，Guard 执行校验
4. **Schema 校验统一**: 使用 Zod 进行环境变量和数据校验

### 环境变量配置

项目使用 Zod 进行环境变量校验，配置文件位于 `src/config/env.config.ts`。

必需环境变量：

- `PORT`: 服务端口（默认 3000）
- `ALLOWED_ORIGINS`: 允许的 CORS 来源（逗号分隔）

可通过 `.env` 文件配置：

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 全局配置

应用入口 `main.ts` 中配置了：

- 全局前缀：`api`
- API 版本控制：URI 版本，默认 v1
- CORS：允许携带凭证
- 全局管道：ValidationPipe（启用转换、白名单、禁止非白名单字段）
- Cookie 解析：启用 cookie-parser

## 测试规范

- 测试文件命名：`*.spec.ts`
- 测试目录：`src/` 下与源码同目录
- 测试框架：Jest + ts-jest
- 测试环境：Node.js
- 覆盖率输出：`coverage/` 目录

## 项目阶段规划

### v0.1（基础版本）

- [ ] 用户模块
- [ ] 角色模块
- [ ] 权限模块
- [ ] JWT 登录
- [ ] RBAC Guard

### v0.2（增强版本）

- [ ] 权限缓存（Redis）
- [ ] 超级管理员
- [ ] Swagger 文档

### v1.0（企业版）

- [ ] 完整企业级 RBAC 模板
- [ ] 审计日志
- [ ] 基于资源的动态权限

## 适用场景

- 求职展示项目
- SaaS 基础模板
- 后台管理系统
- 企业权限系统骨架

## 注意事项

1. 当前项目仅包含基础的 Test 模块作为示例，RBAC 相关模块待实现
2. 数据库集成（Prisma + PostgreSQL）为可选功能，需根据需求添加
3. JWT 认证和 RBAC Guard 逻辑需在后续版本中实现
4. 项目使用 NestJS 11，部分 API 可能与 NestJS 10 有差异

## License

MIT
