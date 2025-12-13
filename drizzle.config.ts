import type { Config } from 'drizzle-kit';

export default {
  schema: './libs/shared/database/src/schema/index.ts',
  out: './libs/shared/database/src/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './workbench.db',
  },
} satisfies Config;