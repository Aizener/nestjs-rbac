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

# 🔐 认证流程与前端接入

## 认证流程概览

```
┌─────────────┐    ① 登录      ┌─────────────┐    返回 access_token    ┌─────────────┐
│   前端      │ ──────────────► │  POST       │ ─────────────────────► │   前端      │
│             │  username+      │  /auth/login│                         │  存储 token │
│             │  password      │             │                         │             │
└─────────────┘                └─────────────┘                         └─────────────┘
       │                               │                                      │
       │                               │ ② 服务端缓存 access_token             │
       │                               │    (access_token:userId)             │
       │                               ▼                                      │
       │                        ┌─────────────┐                               │
       │    ③ 请求业务接口       │   Cache     │    ④ 校验 JWT + 缓存匹配       │
       │ ─────────────────────►│  (Keyv)     │ ◄─────────────────────────────┘
       │  Header: Authorization │             │
       │  Bearer <access_token> │             │  ⑤ 一致才放行，可立即撤销
       └───────────────────────►└─────────────┘
```

## 接口说明

| 接口                      | 方法 | 说明                    | 需要认证     |
| ------------------------- | ---- | ----------------------- | ------------ |
| `/api/v1/auth/login`      | POST | 登录，返回 access_token | 否           |
| `/api/v1/auth/logout`     | POST | 登出当前设备            | 是（Bearer） |
| `/api/v1/auth/logout-all` | POST | 登出全部设备            | 是（Bearer） |

## 前端接入步骤

### 1. 登录

```javascript
// POST /api/v1/auth/login
const res = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin', // passport-local 默认字段名
    password: 'admin123',
  }),
});

const { access_token } = await res.json();
localStorage.setItem('access_token', access_token);
```

### 2. 请求业务接口

```javascript
const res = await fetch('http://localhost:3000/api/v1/xxx', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
});
```

### 3. 登出

```javascript
// 登出当前设备
await fetch('http://localhost:3000/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
});

// 登出全部设备
await fetch('http://localhost:3000/api/v1/auth/logout-all', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
});

localStorage.removeItem('access_token');
```

## 重要说明

- **access_token**：24 小时有效，存缓存，校验时比对，**可立即撤销**
- **无 refresh**：过期后需重新登录
- **多设备**：最多 5 个会话，超出时踢掉最旧
- **CORS**：需在 `.env` 的 `ALLOWED_ORIGINS` 中配置前端域名

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
