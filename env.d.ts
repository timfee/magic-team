declare module "@/env.mjs" {
  export const env: {
    AUTH_SECRET?: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    NEXTAUTH_URL?: string;
    DATABASE_URL: string;
    CLOUD_SQL_INSTANCE?: string;
    NODE_ENV: "development" | "production" | "test";
  };
}
