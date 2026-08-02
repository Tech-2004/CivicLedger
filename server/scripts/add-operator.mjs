// Registers (or updates) an operator so they can sign in.
//
// Sign-in is gated on the `operators` table: Google proves who someone is, but
// this row is what grants access and RBAC scope. A real email address must be
// here before that person can log in.
//
// Usage:
//   node scripts/add-operator.mjs --email you@gmail.com --role admin
//   node scripts/add-operator.mjs --email dana@gmail.com --role department \
//     --department "Public Works - Roads"
//
// Roles: admin | reviewer | department
//   admin      - all jurisdictions, full access
//   reviewer   - their jurisdiction, plus the manual review / moderation queue
//   department - their department's cases only
//
// Runs against the DIRECT (unpooled) connection, as the table owner.
import pg from "pg";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", "..", ".env") });
loadEnv({ path: join(__dirname, "..", ".env") });

const VALID_ROLES = ["admin", "reviewer", "department"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
const role = typeof args.role === "string" ? args.role : "department";
const name = typeof args.name === "string" ? args.name : null;
const departmentName = typeof args.department === "string" ? args.department : null;

if (!email || !email.includes("@")) {
  console.error("Missing or invalid --email\n");
  console.error("  node scripts/add-operator.mjs --email you@gmail.com --role admin");
  process.exit(1);
}
if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid --role '${role}'. Expected one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}
if (role === "department" && !departmentName) {
  console.error(
    "Role 'department' needs --department \"<name>\" so the operator is scoped to one.\n" +
      "Run with --list-departments to see the options.",
  );
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL_UNPOOLED (or DATABASE_URL) first.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // Phase 1 is single-tenant: default to the earliest jurisdiction, matching
  // how ingest assigns one.
  const jurisdiction = await client.query(
    `SELECT id, name FROM jurisdictions ORDER BY created_at ASC LIMIT 1`,
  );
  if (jurisdiction.rowCount === 0) {
    throw new Error("No jurisdictions found. Run `npm run db:seed` first.");
  }
  const jurisdictionId = jurisdiction.rows[0].id;

  let departmentId = null;
  if (departmentName) {
    const dept = await client.query(
      `SELECT id FROM departments WHERE jurisdiction_id = $1 AND name = $2`,
      [jurisdictionId, departmentName],
    );
    if (dept.rowCount === 0) {
      const available = await client.query(
        `SELECT name FROM departments WHERE jurisdiction_id = $1 ORDER BY name`,
        [jurisdictionId],
      );
      throw new Error(
        `No department named "${departmentName}". Available:\n  ` +
          available.rows.map((r) => r.name).join("\n  "),
      );
    }
    departmentId = dept.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO operators (email, name, role, jurisdiction_id, department_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
       SET name = COALESCE(EXCLUDED.name, operators.name),
           role = EXCLUDED.role,
           jurisdiction_id = EXCLUDED.jurisdiction_id,
           department_id = EXCLUDED.department_id
     RETURNING id, email, role,
               (xmin::text = txid_current()::text) AS inserted`,
    [email, name, role, jurisdictionId, departmentId],
  );

  const row = result.rows[0];
  console.log(
    `${row.inserted ? "added" : "updated"}  ${row.email}  role=${row.role}` +
      `  jurisdiction=${jurisdiction.rows[0].name}` +
      (departmentName ? `  department=${departmentName}` : ""),
  );
  console.log("\nThey can now sign in with Google using that email address.");
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
