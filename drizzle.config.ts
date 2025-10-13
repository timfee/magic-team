import { type Config } from "drizzle-kit";

import { env } from "@/env.mjs";

export default {
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  out: "./drizzle",
} satisfies Config;
