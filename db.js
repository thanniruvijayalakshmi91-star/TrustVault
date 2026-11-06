const { Pool } = require("pg");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Add your PostgreSQL connection string.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT, role VARCHAR(20) NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        EXECUTE 'UPDATE users SET password_hash = password WHERE password_hash IS NULL';
        EXECUTE 'ALTER TABLE users ALTER COLUMN password DROP NOT NULL';
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL, stored_name TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL,
      file_size BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS document_shares (
      id SERIAL PRIMARY KEY, document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission VARCHAR(10) NOT NULL CHECK (permission IN ('read','edit')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(document_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL, details TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
    CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $
    BEGIN
      RAISE EXCEPTION 'Audit log records are append-only';
    END;
    $ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS audit_logs_no_update_delete ON audit_logs;
    CREATE TRIGGER audit_logs_no_update_delete
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
  `);
}
module.exports = { pool, initializeDatabase };
