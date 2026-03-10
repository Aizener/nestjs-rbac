// Prisma 7: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
import { defineConfig } from 'prisma/config';

import { env } from './src/config/env.config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
