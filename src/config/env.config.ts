import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().min(1, 'PORT 为必填项').default('3000'),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS 为必填项')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
  JWT_CONSTANTS: z.string().min(1, 'JWT_CONSTANTS 为必填项'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL 为必填项'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`环境变量校验失败: ${parsedEnv.error.message}`);
}

type envType = z.infer<typeof envSchema>;

export const env = {
  PORT: parsedEnv.data.PORT,
  ALLOWED_ORIGINS: parsedEnv.data.ALLOWED_ORIGINS,
  JWT_CONSTANTS: parsedEnv.data.JWT_CONSTANTS,
  DATABASE_URL: parsedEnv.data.DATABASE_URL,
} satisfies envType;
