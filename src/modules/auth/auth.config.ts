/**
 * Auth 模块配置
 *
 * 方案：单 access_token + 缓存，支持多设备
 * - 登录生成 token 并存入缓存，每设备独立会话（jti 区分）
 * - 请求时校验 JWT + 缓存匹配，可立即撤销
 * - 过期后需重新登录（无 refresh）
 */

/** Token 过期时间（秒） */
export const TOKEN_EXPIRY = 86400; // 24 小时

/** 缓存 key 前缀 */
export const CACHE_KEY_PREFIX = {
  ACCESS_TOKEN: 'access_token:',
  USER_SESSIONS: 'user_sessions:',
} as const;

/** 每用户最大会话数，超出时踢掉最旧 */
export const MAX_SESSIONS_PER_USER = 5;

/** JwtModule 所需格式 */
export const JWT_EXPIRES_IN = `${TOKEN_EXPIRY}s`;
