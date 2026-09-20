import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection (port 5432) for migrations/schema push
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/malaz",
  },
});
