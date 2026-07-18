// Loads db/seed.sql against the UNPOOLED connection. Usage: npm run db:seed
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", "..", ".env") });
loadEnv({ path: join(__dirname, "..", ".env") });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Set DATABASE_URL_UNPOOLED (or DATABASE_URL) first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  const sql = readFileSync(join(__dirname, "..", "db", "seed.sql"), "utf8");
  await client.query(sql);
  console.log("seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
