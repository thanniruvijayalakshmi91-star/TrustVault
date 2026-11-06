require("dotenv").config();
const { Pool } = require("pg");

async function promoteViewer() {
  const email = String(process.env.VIEWER_EMAIL || "").trim().toLowerCase();
  if (!email) throw new Error("Set VIEWER_EMAIL in the server environment.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const result = await pool.query(
      "UPDATE users SET role = 'viewer' WHERE LOWER(email) = $1 RETURNING id, name, email, role",
      [email]
    );
    if (!result.rowCount) throw new Error("No account found. Register the viewer account first.");
    console.log("Read-only viewer role granted to:", result.rows[0].email);
  } finally {
    await pool.end();
  }
}
promoteViewer().catch(error => { console.error("Viewer setup failed:", error.message); process.exitCode = 1; });
