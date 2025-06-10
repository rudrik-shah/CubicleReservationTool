import { defineConfig } from "drizzle-kit";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Parse the DATABASE_URL for host, user, password, database, port
const match = DATABASE_URL.match(/^postgres(?:ql)?:\/\/(?<user>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)\/(?<database>[^?]+)/);
if (!match || !match.groups) {
  throw new Error("DATABASE_URL is not in the correct format");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: match.groups.host,
    port: Number(match.groups.port),
    user: match.groups.user,
    password: match.groups.password,
    database: match.groups.database,
    ssl: false, // Force SSL off for local Postgres
  },
});
