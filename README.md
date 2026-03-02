# NestJS RBAC Template

一个基于 NestJS 的简洁 RBAC（Role-Based Access Control）基础模板，适用于中小型 SaaS 或后台管理系统。

本项目目标：

- 清晰的分层结构
- 可扩展的权限系统
- 适合求职展示

---

# 📦 技术栈

- NestJS
- TypeScript
- Prisma（可选）
- PostgreSQL
- Zod（数据校验）
- JWT（身份认证）

---

# 🧠 什么是 RBAC？

RBAC（Role-Based Access Control）即：

用户 → 角色 → 权限

基本模型：

```
User
  ↓
UserRole
  ↓
Role
  ↓
RolePermission
  ↓
Permission
```

---

# 🗂️ 项目结构

```
src/
 ├── modules/
 │    ├── auth/
 │    ├── user/
 │    ├── role/
 │    ├── permission/
 │    └── rbac/
 │
 ├── common/
 │    ├── decorators/
 │    ├── guards/
 │    ├── pipes/
 │
 ├── config/
 └── main.ts
```

---

# 🧩 数据模型设计

## User

| 字段     | 类型   |
| -------- | ------ |
| id       | uuid   |
| email    | string |
| password | string |

---

## Role

| 字段 | 类型   |
| ---- | ------ |
| id   | uuid   |
| name | string |

示例：

- admin
- editor
- user

---

## Permission

| 字段 | 类型   |
| ---- | ------ |
| id   | uuid   |
| name | string |

示例：

- user:create
- user:update
- user:delete
- post:publish

---

## 关系表

### UserRole

- userId
- roleId

### RolePermission

- roleId
- permissionId

---

# 🔐 权限控制流程

1. 用户登录
2. 生成 JWT
3. 请求接口
4. JWT Guard 验证
5. RBAC Guard 验证权限
6. 放行或拒绝

---

# 🛡️ 权限守卫设计

## 1️⃣ 自定义权限装饰器

```ts
@Permission('user:create')
```

---

## 2️⃣ RBAC Guard 核心逻辑

- 获取当前用户
- 查询用户角色
- 查询角色权限
- 判断是否包含所需权限
- 不满足则抛出 ForbiddenException

---

# 🚀 示例接口

```ts
@Post()
@Permission('user:create')
createUser() {
  return 'created'
}
```

---

# 🧪 初始化数据建议

推荐初始化：

- admin 角色
- user 角色
- 基础权限集合

并给 admin 分配全部权限。

---

# ⚙️ 启动方式

```bash
npm install
npm run start:dev
```

默认访问地址：

```
http://localhost:3000
```

---

# 📌 未来扩展方向

- 基于资源的动态权限
- 权限缓存（Redis）
- 审计日志

---

# 💡 设计原则

- 模块职责单一
- 权限系统独立于业务模块
- Guard + Decorator 解耦
- Schema 校验统一

---

# 🧊 项目阶段规划

### v0.1

- 用户模块
- 角色模块
- 权限模块
- JWT 登录
- RBAC Guard

### v0.2

- 权限缓存
- 超级管理员
- Swagger 文档

### v1.0

- 企业级完整 RBAC 模板

---

# 📚 适用场景

- 求职展示项目
- SaaS 基础模板
- 后台管理系统
- 作为企业权限系统骨架

---

# 🪪 License

MIT
