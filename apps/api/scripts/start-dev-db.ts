/**
 * apps/api/scripts/start-dev-db.ts
 *
 * Boots a self-contained PostgreSQL 17 instance on localhost:5432 for the
 * FlowFix AI dev workflow. **Zero system install** — `embedded-postgres`
 * ships its own bundled binary via its platform-specific optionalDependency
 * (e.g. `@embedded-postgres/windows-x64`) and runs it as a child process
 * listening on the configured port. The user / password / database name
 * match the values already in `apps/api/.env` DATABASE_URL so the api can
 * point at it without any env changes.
 *
 * Idempotent across restarts:
 *   - On first run, `.pg-data/` doesn't exist → `initialise()` bootstraps
 *     the data dir (creates PG_VERSION, postgresql.conf, schema etc.).
 *   - On subsequent runs, `initialise()` is skipped and we reuse the
 *     persisted data dir.
 *
 * Graceful shutdown: SIGINT / SIGTERM forwards to `pg.stop()` so the
 * cluster flushes + closes cleanly and the data dir is not corrupted.
 *
 * Usage (from project root):
 *   npm -w @flowfix/api run db:dev
 *
 * The process blocks. Press Ctrl-C to stop.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const PORT = 5432;
const USER = 'flowfix';
const PASSWORD = 'flowfix';
const DB = 'flowfix';
// Anchor the data dir to this script's own location (apps/api/scripts/
// → apps/api/.pg-data) rather than `process.cwd()`, because the workflow
// launches the script via `npm -w @flowfix/api run db:dev` from the
// workspace root, which would otherwise drop .pg-data at the project
// root and confuse the first-run-vs-reuse check. Same anchor pattern
// apps/api/src/index.ts uses for .env.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../.pg-data');

const isFresh = !existsSync(DATA_DIR);

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

async function main() {
  if (isFresh) {
    console.log(`[db:dev] initialising a fresh cluster at ${DATA_DIR}`);
    await pg.initialise();
  } else {
    console.log(`[db:dev] reusing existing cluster at ${DATA_DIR}`);
  }

  await pg.start();
  // v17 of `embedded-postgres` only exposes `createDatabase(name)`; there
  // is no IfNotExists variant. On a fresh cluster the database obviously
  // doesn't exist, but on subsequent runs the data dir is reused and the
  // database may already be there — we wrap the call so the workflow
  // stays idempotent across restarts.
  try {
    await pg.createDatabase(DB);
    console.log(`[db:dev] created database '${DB}'`);
  } catch (e) {
    // Log the swallowed error so a future wording change or a subtle
    // permission issue (instead of 'already exists') is visible in
    // db.log. We still re-throw non-`already exists` errors so the
    // operator sees them in the dev shell.
    if (e instanceof Error && /already exists/i.test(e.message)) {
      console.log(
        `[db:dev] database '${DB}' already exists (ok; detail: ${e.message})`,
      );
    } else {
      throw e;
    }
  }

  const url = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB}`;
  console.log('');
  console.log('[db:dev] ✅ Postgres is up');
  console.log(`[db:dev]    data dir : ${DATA_DIR}`);
  console.log(`[db:dev]    DATABASE_URL: ${url}`);
  console.log('');
  // Under `nohup` no terminal is attached, so Ctrl-C would not reach
  // this process — `stop` it via `pkill -f start-dev-db` or by killing
  // the parent npm process. When run interactively in a terminal the
  // SIGINT handler below also covers Ctrl-C.
  console.log('[db:dev] Running. Stop with: pkill -f start-dev-db');
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[db:dev] received ${signal}, stopping Postgres…`);
  try {
    await pg.stop();
  } catch (e) {
    console.error('[db:dev] stop error:', e);
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

main().catch((e) => {
  console.error('[db:dev] fatal:', e);
  process.exit(1);
});
