import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().min(1, 'PORT is required.').default('3000'),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS is required.')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

type envType = z.infer<typeof envSchema>;

export const env = {
  PORT: parsedEnv.data.PORT,
  ALLOWED_ORIGINS: parsedEnv.data.ALLOWED_ORIGINS,
} satisfies envType;
