// Runs every .sql file in db/migrations in lexical order against the
// UNPOOLED connection (DDL + role creation must not go through the pooler).
// Usage: npm run db:migrate
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load env from the repo root (../../.env) then the server package (../.env).
loadEnv({ path: join(__dirname, "..", "..", ".env") });
loadEnv({ path: join(__dirname, "..", ".env") });

const migrationsDir = join(__dirname, "..", "db", "migrations");

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Set DATABASE_URL_UNPOOLED (or DATABASE_URL) first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = await client.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [file],
    );
    if (already.rowCount) {
      console.log(`skip   ${file}`);
      continue;
    }
    let sql = readFileSync(join(migrationsDir, file), "utf8");
    sql = sql.replace(/\$\{CIVIC_APP_PASSWORD\}/g, process.env.DATABASE_PASSWORD);
    console.log(`apply  ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  console.log("migrations complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
